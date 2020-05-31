/*
 * @Author: Chenxu
 * @Date: 2020-05-14 18:28:35
 * @LastEditTime: 2020-05-14 21:06:38
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
    topTipMsg: '',
    form: {},
    levels: [1, 2, 3, 4, 5]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 设置标题
    wx.setNavigationBarTitle({
      title: app.globalData.deviceName  // 设置页面标题
    })

    this.setLanguage();	// (1)
    event.on("languageChanged", this, this.setLanguage); // (2)
    this.initForm()
    // 切换到setting1，这是避免tabbar第二次加载时，试图显示不全的bug
    wx.switchTab({ url: '../setting1/setting1' })
  },
  setLanguage () {
    this.setData({
      language: wx.T.getLanguage()
    });

    // 设置选项语言
    this.setData({
      yesOrNo: [
        wx.T.getLanguage().options.options1,
        wx.T.getLanguage().options.options2
      ],
      sounds: [
        wx.T.getLanguage().options.options3,
        wx.T.getLanguage().options.options4,
        wx.T.getLanguage().options.options5,
        wx.T.getLanguage().options.options6
      ],
      unlawfulness: [
        wx.T.getLanguage().options.options3,
        wx.T.getLanguage().options.options26,
        wx.T.getLanguage().options.options27,
        wx.T.getLanguage().options.options28
      ],
      reverse: [
        wx.T.getLanguage().options.options3,
        wx.T.getLanguage().options.options29,
        wx.T.getLanguage().options.options30,
        wx.T.getLanguage().options.options27,
        wx.T.getLanguage().options.options31
      ],
      d5Range: [
        wx.T.getLanguage().options.options7,
        wx.T.getLanguage().options.options8,
        wx.T.getLanguage().options.options9
      ]
    })

    console.log(wx.T.getLanguage().tabbars)
    // 设置选项标题
    wx.setTabBarItem({
      index: 0,
      text: wx.T.getLanguage().tabbars.tabbar1,
    })
    wx.setTabBarItem({
      index: 1,
      text: wx.T.getLanguage().tabbars.tabbar2,
    })
    wx.setTabBarItem({
      index: 2,
      text: wx.T.getLanguage().tabbars.tabbar3,
    })
    wx.setTabBarItem({
      index: 3,
      text: wx.T.getLanguage().tabbars.tabbar4,
    })
  },
  // picker 是否
  changeYesOrNo (event) {
    let value = event.detail.value;
    const key = event.currentTarget.dataset.field
    this.setData({
      form: {
        ...this.data.form,
        [key]: Number(value) + 1
      }
    })
  },
  // 初始化值
  initForm () {
    var tempJson = app.getContentToJson()
    // for (const key in tempJson) {
    //   if (tempJson.hasOwnProperty(key)) {
    //     var element = tempJson[key];
    //     // 去 0 操作
    //     tempJson[key] = element.replace(0, '')
    //   }
    // }
    this.setData({
      form: tempJson
    })
  },
  // showToptip
  showTopTip (event) {
    this.setData({
      toptipShow: false
    })
    const page = event.currentTarget.dataset.page
    const key = event.currentTarget.dataset.key
    this.setData({
      toptipShow: true,
      topTipMsg: this.data.language[page][key]
    })
  },
  // 保存
  saveFun (event) {
    const field = event.currentTarget.dataset.field
    if (!this.data.form[field] || this.data.form[field] == '') {
      this.setData({
        errorShow: true,
        topTipMsg: '写入数据不能为空!'
      })
      return false
    }
    // 判断没有 0 添 0 操作
    var sting16 = Number(this.data.form[field]).toString(16)
    var tempStr = String(sting16).length === 1 ? '0' + String(sting16) : String(sting16)
    console.log('0x' + field, '0x' + tempStr)
    app.writeBLECharacteristicValue('0x' + field, '0x' + tempStr)
  },
  // 退出断开连接
  logOut () {
    wx.reLaunch({ url: '../index/index' });
    wx.closeBluetoothAdapter()
  }
})