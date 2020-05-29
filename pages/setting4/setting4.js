/*
 * @Author: Chenxu
 * @Date: 2020-05-14 18:28:35
 * @LastEditTime: 2020-05-14 21:34:16
 */
// pages/setting2/setting2.js
import event from '../../utils/event'
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    language: '',
    toptipShow: false,
    errorShow: false,
    topTipMsg: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: app.globalData.deviceName  // 设置页面标题
    })
    this.setLanguage();	// (1)
    event.on("languageChanged", this, this.setLanguage); // (2)
  },
  setLanguage () {
    this.setData({
      language: wx.T.getLanguage()
    });
  },
  // showToptip
  showTopTip (event) {
    const page = event.currentTarget.dataset.page
    const key = event.currentTarget.dataset.key
    this.setData({
      toptipShow: true,
      topTipMsg: this.data.language[page][key]
    })
  },
  // 操作
  optionFun (event) {
    const field = event.currentTarget.dataset.field
    const value = event.currentTarget.dataset.value
    const alert = event.currentTarget.dataset.alert
    console.log(value)
    wx.showModal({
      title: '提示',
      content: alert,
      success (res) {
        if (res.confirm) {
          app.writeBLECharacteristicValue('0x' + field, '0x' + value, true)
        }
      }
    })
  },
  // 退出断开连接
  logOut () {
    wx.reLaunch({ url: '../index/index' });
    wx.closeBluetoothAdapter()
  }
})