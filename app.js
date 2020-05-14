//app.js
import locales from './utils/locales.js';
import T from './utils/i18n.js';

//用 /utils/locales 注册了 locale
T.registerLocale(locales);
//当前语言设置为用户上一次选择的语言，如果是第一次使用，则调用 T.setLocaleByIndex(0) 将语言设置成中文
T.setLocaleByIndex(wx.getStorageSync('langIndex') || 0);
//将 T 注册到 wx 之下，这样在任何地方都可以调用 wx.T.getLanguage() 来得到当前的语言对象了。
wx.T = T;

App({
  onLaunch: function () {
    // 程序启动hook
  },
  globalData: {
    userInfo: null,
    content: '01020304050203040910111213141516171819202122'
  },
  getContentToJson () {
    var arr = []
    for (let index = 0; index < this.globalData.content.length; index += 2) {
      const tempStr = this.globalData.content.substring(index, index + 2)
      arr.push(tempStr)
    }
    // arr 是22 字节的数组，每一项都代表不同属性的值
    var tempJson = {
      F0: arr[0], // “出入口开启时长”，取值范围 1~255，单位秒
      F1: arr[1], // “延时开闸时间” ，取值范围0~5 
      F2: arr[2], // “延时关闸时间” ，取值范围0~5
      F3: arr[3], // “开门转速等级” ，取值范围 1~10
      F4: arr[4], // “关门转速等级”，取值范围 1~10，
      F5: arr[5], // ”开门扭力等级” ，取值范围1~10，
      F6: arr[6], // “关门扭力等级”，取值范围1~10，

      F7: arr[7], // “是否检测常开门信号”，取值范围 取值范围 0~1
      F8: arr[8], // “刷卡是否记忆”取值范围 0~1
      F9: arr[9], // "左向通行语音”， 取值范围0~3
      FA: arr[10], // “右向通行语音”，取值范围 0~3       
      FB: arr[11], // “尾随进入语音”取值范围 0~2             
      FC: arr[12], // “非法闯入语音”取值范围 0~3  
      FD: arr[13], // ”反向进入提示语音”  
      FE: arr[14], // 音量调节

      D0: arr[15], // “反向闯入处理方式”
      D1: arr[16], // “尾随进入处理方式” 
      D2: arr[17], // 防夹处理方式
      D3: arr[18], // 红外线对数
      D4: arr[19], // 红外开门设置
      D5: arr[20]  // “断电开闸设置” 取值范围 0~2

      // 还有一个备用 arr[21]
    }

    return tempJson
  }
})