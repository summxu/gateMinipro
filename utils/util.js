/*
 * @Author: Chenxu
 * @Date: 2020-05-14 18:28:35
 * @LastEditTime: 2020-05-14 18:42:11
 */
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

// 蓝牙相关
function inArray (arr, key, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i;
    }
  }
  return -1;
}

// ArrayBuffer转16进度字符串示例
function ab2hex (buffer) {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}

// 字符串转ArrayBuffer
function hexStringToArrayBuffer (str) {
  if (!str) {
    return new ArrayBuffer(0);
  }
  var buffer = new ArrayBuffer(str.length / 2); // 字节数 / 2
  let dataView = new DataView(buffer)
  let ind = 0;
  for (var i = 0, len = str.length; i < len; i += 2) {
    let code = parseInt(str.substr(i, 2), 16)
    dataView.setUint8(ind, code)
    ind++
  }
  return buffer;
}

// 16进制转字符串
function hexCharCodeToStr (hexCharCodeStr) {
  var trimedStr = hexCharCodeStr.trim();
  var rawStr = trimedStr.substr(0, 2).toLowerCase() === "0x" ? trimedStr.substr(2) : trimedStr;
  var len = rawStr.length;
  if (len % 2 !== 0) {
    alert("Illegal Format ASCII Code!");
    return "";
  }
  var curCharCode;
  var resultStr = [];
  for (var i = 0; i < len; i = i + 2) {
    curCharCode = parseInt(rawStr.substr(i, 2), 16); // ASCII Code Value

    resultStr.push(String.fromCharCode(curCharCode));
  }
  return resultStr.join("");
}

// 筛选
function onlyFilter (deviceName) {
  var okArr = []  // 预设名字的数组
  for (let index = 0; index < 7; index++) {
    okArr.push(`PedestrianGate_${index + 1}`)
  }
  return okArr.findIndex(item => deviceName)
}

// 筛选并排序设备
function filterSort (devices) {
  var okArr = []  // 预设名字的数组
  for (let index = 0; index < 7; index++) {
    okArr.push(`PedestrianGate_${index + 1}`)
  }

  return devices
    .filter(element => okArr.findIndex(item => item === element.name) !== -1)
    .sort((a, b) => b.RSSI - a.RSSI)
}

// 获取屏幕高度
function getScreenHeight (callback) {
  wx.getSystemInfo({
    success: function (res) {
      // 获取可使用窗口宽度
      let clientHeight = res.windowHeight;
      // 获取可使用窗口高度
      let clientWidth = res.windowWidth;
      // 算出比例
      let ratio = 750 / clientWidth;
      // 算出高度(单位rpx)
      let height = clientHeight * ratio;
      // 设置高度
      callback(height)
    }
  });
}

module.exports = {
  formatTime,
  inArray,
  ab2hex,
  hexStringToArrayBuffer,
  hexCharCodeToStr,
  filterSort,
  onlyFilter,
  getScreenHeight
}