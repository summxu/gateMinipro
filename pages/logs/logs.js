//logs.js

Page({
  data: {
    index: 1,
    list: [{
      "text": "对话",
    },
    {
      "text": "设置",
    }]
  },
  tabChange (e) {
    const index = e.detail.index
    console.log('tab change', e)
  },
  onLoad: function () { }
})
