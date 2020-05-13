// pages/setting1/setting1.js
import event from '../../utils/event'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    language: '',
    toptipShow: false,
    errorShow: false,
    topTipMsg: '',
    form: {}
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
      topTipMsg: this.data.language[page][key]
    })
  },
  // 输入框双向绑定
  formInputChange (event) {
    const value = event.detail.value
    const key = event.currentTarget.dataset.field
    this.setData({
      form: { [key]: value }
    })
  },
  // 保存
  saveFun (event) {
    const field = event.currentTarget.dataset.field
    const att = event.currentTarget.dataset.att
    if (!this.data.form[field] || this.data.form[field] == '') {
      this.setData({
        errorShow: true,
        topTipMsg: '写入数据不能为空!'
      })
      return false
    }
    console.log(att, this.data.form[field])
  },
  // 退出断开连接
  logOut () {
    wx.redirectTo({ url: '../index/index' });
  }
})