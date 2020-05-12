//app.js
import locales from './utils/locales.js';
import T from './utils/i18n.js';
import {
  inArray,
  ab2hex,
  hexStringToArrayBuffer
} from './utils/util'

//用 /utils/locales 注册了 locale
T.registerLocale(locales);
//当前语言设置为用户上一次选择的语言，如果是第一次使用，则调用 T.setLocaleByIndex(0) 将语言设置成中文
T.setLocaleByIndex(wx.getStorageSync('langIndex') || 0);
//将 T 注册到 wx 之下，这样在任何地方都可以调用 wx.T.getLanguage() 来得到当前的语言对象了。
wx.T = T;

App({
  onLaunch: function () {
    // 程序启动hook
    this.openBluetoothAdapter()
  },
  globalData: {
    devices: [],
    connected: false,
    chs: [], // 可读特征
    wchs: [] // 可写特征
  },
  // 打开蓝牙
  openBluetoothAdapter () {
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log('openBluetoothAdapter success', res)
        this.startBluetoothDevicesDiscovery()
      },
      fail: (res) => {
        console.log(res)
        if (res.errCode === 10001) {
          wx.onBluetoothAdapterStateChange(function (res) {
            console.log('onBluetoothAdapterStateChange', res)
            if (res.available) {
              this.startBluetoothDevicesDiscovery()
            }
          })
        }
      }
    })
  },
  getBluetoothAdapterState () {
    wx.getBluetoothAdapterState({
      success: (res) => {
        console.log('getBluetoothAdapterState', res)
        if (res.discovering) {
          this.onBluetoothDeviceFound()
        } else if (res.available) {
          this.startBluetoothDevicesDiscovery()
        }
      }
    })
  },
  // 搜索蓝牙
  startBluetoothDevicesDiscovery () {
    if (this._discoveryStarted) {
      return
    }
    this._discoveryStarted = true
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      success: (res) => {
        console.log('startBluetoothDevicesDiscovery success', res)
        this.onBluetoothDeviceFound()
      },
    })
  },
  // 停止扫描
  stopBluetoothDevicesDiscovery () {
    wx.stopBluetoothDevicesDiscovery()
  },
  // 对扫描到的设备操作
  onBluetoothDeviceFound () {
    wx.onBluetoothDeviceFound((res) => {
      res.devices.forEach(device => {
        if (!device.name && !device.localName) {
          return
        }
        const foundDevices = this.globalData.devices
        const idx = inArray(foundDevices, 'deviceId', device.deviceId)
        const data = {}
        if (idx === -1) {
          data[`devices[${foundDevices.length}]`] = device
        } else {
          data[`devices[${idx}]`] = device
        }
        this.globalData = {
          ...this.globalData,
          ...data
        }
      })
    })
  },
  // 创建蓝牙链接
  createBLEConnection (e) {
    const ds = e.currentTarget.dataset
    const deviceId = ds.deviceId
    const name = ds.name
    wx.createBLEConnection({
      deviceId,
      success: (res) => {
        this.globalData = {
          ...this.globalData,
          connected: true,
          name,
          deviceId
        }
        this.getBLEDeviceServices(deviceId)
      }
    })
    this.stopBluetoothDevicesDiscovery()
  },
  closeBLEConnection () {
    wx.closeBLEConnection({
      deviceId: this.globalData.deviceId
    })
    this.globalData = {
      ...this.globalData,
      connected: false,
      chs: [],
      canWrite: false
    }
  },
  // 获取服务 有2个服务，第一个服务没有用。
  getBLEDeviceServices (deviceId) {
    wx.getBLEDeviceServices({
      deviceId,
      success: (res) => {
        console.log(res)
        for (let i = 0; i < res.services.length; i++) {
          this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid)
        }
      }
    })
  },
  // 获取设备特征块  12个可读 2个可写
  getBLEDeviceCharacteristics (deviceId, serviceId) {
    wx.getBLEDeviceCharacteristics({
      deviceId,
      serviceId,
      success: (res) => {
        console.log('--------特征值获取成功-----------')
        console.log(res)
        console.log('getBLEDeviceCharacteristics success', res.characteristics)
        for (let i = 0; i < res.characteristics.length; i++) {
          let item = res.characteristics[i]
          if (item.properties.read) {
            // 读取设备信息 接口读取到的信息需要在 onBLECharacteristicValueChange 方法注册的回调中获取
            wx.readBLECharacteristicValue({
              deviceId,
              serviceId,
              characteristicId: item.uuid
            })
          }
          if (item.properties.write) {
            this.globalData.canWrite = true
            // 找到可写特征值,并不是一个
            this.globalData.wchs =
              [...this.globalData.wchs, {
                deviceId,
                serviceId,
                characteristicId: item.uuid
              }]
          }
          if (item.properties.notify || item.properties.indicate) {
            // 订阅特征值变化 notify或则indicate 为订阅
            wx.notifyBLECharacteristicValueChange({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
              state: true,
            })
          }
        }
      },
      fail (res) {
        console.error('getBLEDeviceCharacteristics', res)
      }
    })
    // 操作之前先监听，保证第一时间获取数据
    // 获取可读特征值数据，订阅发出数据也会走该回调
    wx.onBLECharacteristicValueChange((characteristic) => {
      console.log('------------获取到推送------------')
      const idx = inArray(this.globalData.chs, 'uuid', characteristic.characteristicId)
      const data = {}
      if (idx === -1) {
        data[`chs[${this.globalData.chs.length}]`] = {
          uuid: characteristic.characteristicId,
          value: ab2hex(characteristic.value)
        }
      } else {
        data[`chs[${idx}]`] = {
          uuid: characteristic.characteristicId,
          value: ab2hex(characteristic.value)
        }
      }
      this.globalData = {
        ...this.globalData,
        ...data
      }
    })
  },
  writeBLECharacteristicValue (event) {
    // 向蓝牙设备发送4字节的数据
    // 分别为 产品序列编号 命令号 内容 异或校验
    const deviceHex = 0x01
    const a = event.currentTarget.dataset.a
    const b = event.currentTarget.dataset.b
    const deviceHexString = deviceHex.toString(16).length === 1 ? `0x0${deviceHex.toString(16)}` : `0x${deviceHex.toString(16)}`
    const checkByte = (deviceHex ^ a ^ b).toString(16)
    const checkByteString = checkByte.length === 1 ? `0x0${checkByte}` : `0x${checkByte}`

    const value = ab2hex(hexStringToArrayBuffer(deviceHexString)).substring(2, 4) +
      ab2hex(hexStringToArrayBuffer(a)).substring(2, 4) +
      ab2hex(hexStringToArrayBuffer(b)).substring(2, 4) +
      ab2hex(hexStringToArrayBuffer(checkByteString)).substring(2, 4)

    console.log(value)
    console.log(hexStringToArrayBuffer(value))

    wx.writeBLECharacteristicValue({
      deviceId: this.globalData.wchs[1].deviceId,
      serviceId: this.globalData.wchs[1].serviceId,
      characteristicId: this.globalData.wchs[1].characteristicId,
      value: hexStringToArrayBuffer(value)
    })

  },
  closeBluetoothAdapter () {
    wx.closeBluetoothAdapter()
    this._discoveryStarted = false
  }
})