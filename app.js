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
  onLaunch: function() {
    // 程序启动hook
  },
  globalData: {
    userInfo: null
  }
})