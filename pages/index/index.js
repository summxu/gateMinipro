//index.js
//获取应用实例
import event from '../../utils/event.js'
import {
  inArray,
  ab2hex,
  filterSort,
  onlyFilter
} from '../../utils/util.js'

const app = getApp()

Page({
  data: {
    language: '',
    languages: ['简体中文', 'English'],
    langIndex: 0,
    devices: [],
    chs: [],
    wchs: []
  },
  //事件处理函数
  onLoad: function () {
    this.setData({
      langIndex: wx.getStorageSync('langIndex') || 0
    });
    // 本页面设置为当前语言
    this.setLanguage();
    // 开始搜索蓝牙
    this.openBluetoothAdapter()
  },
  onShow: function (options) {
    // wx.showToast({
    //   title: '搜索设备...',
    //   icon: 'loading',
    //   mask: true
    // })
  },
  setLanguage: function () {
    this.setData({
      language: wx.T.getLanguage()
    });
  },
  toSetting: function (e) {
    wx.reLaunch({ url: '../setting2/setting2', })
  },
  // 改变语言
  changeLanguage: function (e) {
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
  openBluetoothAdapter () {
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log('openBluetoothAdapter success', res)
        this.startBluetoothDevicesDiscovery()
      },
      fail: (res) => {
        if (res.errCode === 10001) {
          wx.showModal({
            title: '提示',
            content: '蓝牙未开启，请打开蓝牙',
            showCancel: false
          })
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
    // if (this._discoveryStarted) {
    //   return
    // }
    // this._discoveryStarted = true
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
    wx.hideLoading()
    wx.onBluetoothDeviceFound((res) => {
      res.devices.forEach(device => {
        if (!device.name && !device.localName) {
          return
        }
        const foundDevices = this.data.devices
        const idx = inArray(foundDevices, 'deviceId', device.deviceId)
        const data = {}
        const tempDevice = {
          ...device,
          nickName: this.data.language.devices[device.name] // 别名
        }
        if (idx === -1) {
          data[`devices[${foundDevices.length}]`] = tempDevice
        } else {
          data[`devices[${idx}]`] = tempDevice
        }
        if (onlyFilter(tempDevice.name) !== -1) {
          this.setData(data)
        }
        // 筛选并排序设备
        this.setData({
          devices: filterSort(this.data.devices)
        })
      })
    })
  },
  // 创建蓝牙链接
  createBLEConnection (e) {
    wx.showToast({
      title: '创建蓝牙连接...',
      icon: 'loading',
      duration: 99999,
      mask: true
    })
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
        // 链接到设备之后 给全局加上name
        app.globalData.deviceName = name
        this.getBLEDeviceServices(deviceId)
      }
    })
    this.stopBluetoothDevicesDiscovery()
  },
  closeBLEConnection () {
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
  getBLEDeviceServices (deviceId) {
    wx.getBLEDeviceServices({
      deviceId,
      success: (res) => {
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
        for (let i = 0; i < res.characteristics.length; i++) {
          let item = res.characteristics[i]
          console.log(item.properties)
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

            // 找到可写特征值,并不是一个
            this.setData({
              wchs: [...this.data.wchs, {
                deviceId,
                serviceId,
                characteristicId: item.uuid
              }]
            })

            // 把可写特征值存入 gloabData
            // 找到可写特征值,并不是一个
            app.globalData.wchs = [
              ...this.data.wchs,
              {
                deviceId,
                serviceId,
                characteristicId: item.uuid
              }
            ]
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
    // 0000FFF2-0000-1000-8000-00805F9B34FB 数据在uuid为这个里面
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
      this.setData(data)
      if (characteristic.characteristicId == '0000FFF2-0000-1000-8000-00805F9B34FB') {
        // 把内容存入globalData
        app.globalData.content = ab2hex(characteristic.value)
        // 跳转页面
        console.log(app.globalData.content)
        console.log(app.getContentToJson());
        this.toSetting()
      }
    })
  },

  closeBluetoothAdapter () {
    wx.closeBluetoothAdapter()
    // this._discoveryStarted = false
  }
})