//index.js
//获取应用实例
import event from '../../utils/event.js'
import {
  inArray,
  ab2hex,
  hexStringToArrayBuffer,
  hexCharCodeToStr
} from '../../utils/util.js'

const app = getApp()

Page({
  data: {
    language: '',
    languages: ['简体中文', 'English'],
    langIndex: 0,
    devices: [],
    connected: false,
    chs: [], // 可读特征
    wchs: [], // 可写特征
  },
  //事件处理函数
  onLoad: function() {
    this.setData({
      langIndex: wx.getStorageSync('langIndex') || 0
    });
    // 本页面设置为当前语言
    this.setLanguage();
  },
  setLanguage: function() {
    this.setData({
      language: wx.T.getLanguage()
    });
  },
  toSetting: function(e) {
    wx.switchTab({
      url: '../setting1/setting1',
    })
  },
  // 改变语言
  changeLanguage: function(e) {
    let index = e.detail.value;
    this.setData({ // (1)
      langIndex: index
    });
    wx.T.setLocaleByIndex(index);
    this.setLanguage();

    event.emit('languageChanged');

    wx.setStorage({
      key: 'langIndex',
      data: this.data.langIndex
    })
  },
  // 打开蓝牙
  openBluetoothAdapter() {
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log('openBluetoothAdapter success', res)
        this.startBluetoothDevicesDiscovery()
      },
      fail: (res) => {
        if (res.errCode === 10001) {
          wx.onBluetoothAdapterStateChange(function(res) {
            console.log('onBluetoothAdapterStateChange', res)
            if (res.available) {
              this.startBluetoothDevicesDiscovery()
            }
          })
        }
      }
    })
  },
  getBluetoothAdapterState() {
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
  startBluetoothDevicesDiscovery() {
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
  stopBluetoothDevicesDiscovery() {
    wx.stopBluetoothDevicesDiscovery()
  },
  // 对扫描到的设备操作
  onBluetoothDeviceFound() {
    wx.onBluetoothDeviceFound((res) => {
      res.devices.forEach(device => {
        if (!device.name && !device.localName) {
          return
        }
        const foundDevices = this.data.devices
        const idx = inArray(foundDevices, 'deviceId', device.deviceId)
        const data = {}
        if (idx === -1) {
          data[`devices[${foundDevices.length}]`] = device
        } else {
          data[`devices[${idx}]`] = device
        }
        this.setData(data)
      })
    })
  },
  // 创建蓝牙链接
  createBLEConnection(e) {
    const ds = e.currentTarget.dataset
    const deviceId = ds.deviceId
    const name = ds.name
    wx.createBLEConnection({
      deviceId,
      success: (res) => {
        this.setData({
          connected: true,
          name,
          deviceId,
        })
        this.getBLEDeviceServices(deviceId)
      }
    })
    this.stopBluetoothDevicesDiscovery()
  },
  closeBLEConnection() {
    wx.closeBLEConnection({
      deviceId: this.data.deviceId
    })
    this.setData({
      connected: false,
      chs: [],
      canWrite: false,
    })
  },
  // 获取服务 有2个服务，第一个服务没有用。
  getBLEDeviceServices(deviceId) {
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
  getBLEDeviceCharacteristics(deviceId, serviceId) {
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
            this.setData({
              canWrite: true
            })
            // this._deviceId = deviceId
            // this._serviceId = serviceId
            // this._characteristicId = item.uuid
            // this.writeBLECharacteristicValue()
            // 找到可写特征值,并不是一个
            this.setData({
              wchs: [...this.data.wchs, {
                deviceId,
                serviceId,
                characteristicId: item.uuid
              }]
            })
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
      fail(res) {
        console.error('getBLEDeviceCharacteristics', res)
      }
    })
    // 操作之前先监听，保证第一时间获取数据
    // 获取可读特征值数据，订阅发出数据也会走该回调
    wx.onBLECharacteristicValueChange((characteristic) => {
      console.log('------------获取到推送------------')
      const idx = inArray(this.data.chs, 'uuid', characteristic.characteristicId)
      const data = {}
      if (idx === -1) {
        data[`chs[${this.data.chs.length}]`] = {
          uuid: characteristic.characteristicId,
          value: ab2hex(characteristic.value)
        }
      } else {
        data[`chs[${idx}]`] = {
          uuid: characteristic.characteristicId,
          value: ab2hex(characteristic.value)
        }
      }
      // data[`chs[${this.data.chs.length}]`] = {
      //   uuid: characteristic.characteristicId,
      //   value: ab2hex(characteristic.value)
      // }
      this.setData(data)
    })
  },
  writeBLECharacteristicValue(event) {
    // 向蓝牙设备发送4字节的数据
    // 分别为 产品序列编号 命令号 内容 异或校验

    // console.log({
    //   deviceId: this.data.wchs[1].deviceId,
    //   serviceId: this.data.wchs[1].serviceId,
    //   characteristicId: this.data.wchs[1].characteristicId
    // })
    // console.log((0x01 ^ 0xF0 ^ 0x05).toString(16))

    // let buffer = new ArrayBuffer(4)
    // let dataView = new DataView(buffer) // 使用dataView设置ArrayBuffer字节
    // dataView.setUint8(0, 0x01F903FD) // Uint32Array输入4字节大小(偏移量，字节)
    // console.log(buffer)
    // 异或校验
    const a = event.currentTarget.dataset.a
    const b = event.currentTarget.dataset.b
    const deviceHex = 0x01
    const checkByte = (deviceHex ^ a ^ b).toString(16)
    const deviceString = hexCharCodeToStr(deviceHex)
    const stringA = hexCharCodeToStr(a)
    const stringB = hexCharCodeToStr(b)
    console.log(`${deviceString}${stringA}${stringB}${checkByte}`)
    wx.writeBLECharacteristicValue({
      deviceId: this.data.wchs[1].deviceId,
      serviceId: this.data.wchs[1].serviceId,
      characteristicId: this.data.wchs[1].characteristicId,
      value: hexStringToArrayBuffer(`${deviceString}${stringA}${stringB}${checkByte}`)
    })
  },
  closeBluetoothAdapter() {
    wx.closeBluetoothAdapter()
    this._discoveryStarted = false
  },
})