//index.js
//获取应用实例
import event from '../../utils/event.js'

const app = getApp()

Page({
  data: {
    language: '',
    languages: ['简体中文', 'English'],
    langIndex: 0,
    devices: []
  },
  //事件处理函数
  onLoad: function () {
    this.setData({
      langIndex: wx.getStorageSync('langIndex') || 0
    });
    // 本页面设置为当前语言
    this.setLanguage();
    console.log(app.globalData)
    this.setData({
      devices: app.globalData.devices
    })
  },
  setLanguage: function () {
    this.setData({
      language: wx.T.getLanguage()
    });
  },
  toSetting: function (e) {
    wx.switchTab({
      url: '../setting1/setting1',
    })
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

})