//app.js
App({
  onLaunch: function (ops) {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    var self = this;
    // 登录
    wx.login({
      success: res => {
        wx.request({
          url: 'https://www.chenzhicheng.com/miniprogram/auth?code='+res.code,
          header: {
            'content-type': 'application/json' // 默认值
          },
          success: function (res) {
            if (res.statusCode==200) {
              var data = JSON.parse(res.data);
              self.globalData.openid = data.openid;
              self.globalData.session_key = data.session_key;
              if (self.userInfoReadyCallback) {
                self.userInfoReadyCallback(res)
              }
              self.getModel();
            }
          }
        })
        
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo
              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
    wx.showShareMenu({
      withShareTicket: true
    })
  },
  onShow: function (ops) {
    var self = this;
    if (ops.scene == 1044) {
      self.globalData.shareTicket = ops.shareTicket;
      wx.getShareInfo({
        shareTicket: ops.shareTicket,
        success: function (obj) {
          wx.request({
            url: 'https://www.chenzhicheng.com/api/fccusers/miniprogram/decrypt',
            header: {
              'content-type': 'application/json' // 默认值
            },
            method: 'POST',
            data: {
              encryptedData: obj.encryptedData,
              iv: obj.iv,
              session_key: self.globalData.session_key,
              openid: self.globalData.openid
            },
            success: function (res) {
              if (res.statusCode == 200) {
                self.globalData.openGId = res.data.openGId;
                if (self.openGIdCallback) {
                  self.openGIdCallback(res)
                }
                self.getData();
                self.getModel();
              } else if (res.statusCode == 401) {
                setTimeout(self.onShow(ops), 1000);
              } else {
                self.getData();
                self.getModel();
              }
            }
          });
        }
      });
    } else {
      self.getData();
      self.getModel();
    }
  },
  globalData: {
    userInfo: null,
    openid: null,
    ranks: null,
    model: null,
    shareTicket: null,
    session_key: null,
    openGId: null,
    dirty: false
  }, 
  //获取排名数据
  getData: function(){
    var self = this;
    wx.request({
      url: 'https://www.chenzhicheng.com/api/fccusers/top100/alltime?openGId=' + this.globalData.openGId+'&rand='+new Date().getTime(),
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function (res) {
        self.globalData.ranks = res.data;
        if (self.dataReadyCallback) {
          self.dataReadyCallback(res)
        }
      }
    })
  },
  //获取用户FCC 数据
  getModel: function() {
    var self = this;
    wx.request({
      url: 'https://www.chenzhicheng.com/api/fccusers/verify-openid/openid/' + self.globalData.openid,
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function (res) {
        if (res.statusCode==200) {
          self.globalData.model = res.data;
        } else {
          self.globalData.model = undefined;
        }
        if (self.openidReadyCallback) {
          self.openidReadyCallback(res)
        }
      }
    })
  }
})