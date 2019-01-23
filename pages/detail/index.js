//index.js
//获取应用实例
const app = getApp()
var util = require('../../utils/util.js');
var animation = wx.createAnimation({
  duration: 100,
  timingFunction: 'linear',
})
var i = 1;
Page({
  data: {
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    loading: false,
    animationData: {}
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  bindBack: function () {
    wx.navigateBack()
  },
  bindRefresh: function(cb) {
    var self = this;
    if (self.data.loading) {
      if (cb) {
        return cb();
      }
      return;
    }
    self.setData({
      loading: true
    });
    this.data.interval = setInterval(this.rotate, 100); 
    wx.request({
      url: 'https://www.chenzhicheng.com/api/fccusers/update/' + self.data.model.username, 
      success: function (res) {
        i=0;
        clearInterval(self.data.interval);
        var bean = res.data;
        if (res.statusCode == 200) {
          if (self.data.self) {
            bean.openid = app.globalData.openid;
          }
          app.getData();
          app.dataReadyCallback = res => {
            self.setData({
              loading: false
            })
            wx.showToast({
              title: '刷新成功',
              duration: 2000
            })
            bean.lastUpdate = util.formatTime(new Date(bean.lastUpdate));
            self.setData({
              model: bean,
            })
            if (cb) {
              return cb();
            }
          }
        } else {
          self.setData({
            loading: false
          })
          wx.showToast({
            title: '刷新失败，请稍后重试',
            icon: 'none',
            duration: 2000
          })
          if (cb) {
            return cb();
          }
        }
      },
      fail: function (res) {
        self.setData({
          loading: false
        })
        i = 0;
        clearInterval(self.data.interval);
        wx.showToast({
          title: '刷新失败，请稍后重试',
          icon: 'none',
          duration: 2000
        })
      }      
    })
  },
  bindGroupRank:function() {
    app.globalData.openGId = this.data.model.openGId;
    app.getData();
    app.dataReadyCallback = res => {
      wx.navigateBack()
    }
  },
  bindFCCRank: function () {
    app.globalData.openGId = null;
    app.getData();
    app.dataReadyCallback = res => {
      wx.navigateBack()
    }
  },
  bindAccount: function () {
    var self = this;
    if (self.data.loading) {
      return ;
    }
    self.setData({
      loading: true
    });
    wx.request({
      url: 'https://www.chenzhicheng.com/api/fccusers/bind/username/' + self.data.model.username, //仅为示例，并非真实的接口地址
      header: {
        'content-type': 'application/json' // 默认值
      },
      method: 'POST',
      data: {
        avatarUrl: self.data.userInfo.avatarUrl,
        nickName: self.data.userInfo.nickName,
        gender: self.data.userInfo.gender,
        openid: app.globalData.openid,
        openGId: app.globalData.openGId
      },
      success: function (res) {
        if (res.statusCode == 200) {
          
          app.getModel();
          app.openidReadyCallback = res => {
            res.data.lastUpdate = util.formatTime(new Date(res.data.lastUpdate));
            res.data.alltime = res.data.points;
            res.data.recent = res.data.pointsRecent;
            res.data.openid = app.globalData.openid;
            self.setData({
              model: res.data,
              animation: '',
              loading: false
            })
            self.bindRefresh(function(){
              app.globalData.dirty = true;
              wx.showToast({
                title: '绑定成功',
                duration: 2000
              })
            });
          }
        } else {
          self.setData({
            animation: ''
          })
          wx.showToast({
            title: '绑定失败，请稍后重试',
            icon: 'none',
            duration: 2000
          })
        }
      }
    })
  },
  unbindAccount: function () {
    var self = this;
    if (self.data.loading) {
      return;
    }
    self.setData({
      loading: true
    });
    wx.request({
      url: 'https://www.chenzhicheng.com/api/fccusers/unbind/username/' + self.data.model.username, 
      header: {
        'content-type': 'application/json' // 默认值
      },
      method: 'POST',
      success: function (res) {
        if (res.statusCode == 200) {
          res.data.lastUpdate = util.formatTime(new Date(res.data.lastUpdate));
          res.data.alltime = res.data.points;
          res.data.recent = res.data.pointsRecent;
          self.setData({
            model: res.data
          })
          app.getModel();
          app.openidReadyCallback = res => {
            app.getData();
            app.dataReadyCallback = res => {
              self.setData({
                loading: false
              })
              wx.showToast({
                title: '解绑成功',
                duration: 2000
              })
            }
          }
        } else {
          wx.showToast({
            title: '解绑失败，请稍后重试',
            icon: 'none',
            duration: 2000
          })
        }
      }
    })
  },
  onLoad: function (options) {
    var bean = JSON.parse(decodeURIComponent(options.model));
    var self = options.self;
    var that = this;
    if (app.globalData.openGId) {
      this.setData({
        group: true
      });
    }
    if (options.model == null) {
      wx.showToast({
        title: '数据为空',
      })
      return;
    }
    bean.lastUpdate = util.formatTime(new Date(bean.lastUpdate));
    this.setData({
      model: bean,
      self: self,
    })
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  getUserInfo: function(e) {
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  rotate:function() {
    animation.rotate(++i*45).step()
    this.setData({
      animationData: animation.export()
    })
  }
})
