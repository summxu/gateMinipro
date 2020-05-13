// pages/setting1/setting1.js
import event from '../../utils/event'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    language: '',
    toptipShow: false,
    topTipMsg: '你好啊'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
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
    console.log(page, key)
    console.log(this.data.language[page][key])
    this.setData({
      toptipShow: true,
      // toptipMessage: this.data.language[page][key]
    })
  },
  // 退出断开连接
  logOut () {
    wx.redirectTo({ url: '../index/index' });
  }
})