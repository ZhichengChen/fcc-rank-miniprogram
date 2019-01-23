//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    motto: 'FCC 排行榜',
    userInfo: {},
    hasUserInfo: false,
    loading: true,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    inputValue:'',
    rankLoad: false,
    modelLoad: false,
    model: null
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  bindKeyInput: function (e) {
    this.setData({
      inputValue: e.detail.value
    })
  },
  //事件处理函数
  bindAccount: function () {
    var self = this;
    if (!this.data.inputValue) {
      return wx.showToast({
        title: '请输入Github 账号',
        icon: 'none',
        duration: 2000
      })
    }
    self.setData({
      loading: true
    });
    wx.request({
      url: 'https://www.chenzhicheng.com/api/fccusers/verify/username/'+this.data.inputValue, 
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function (res) {
        if (res.data) {
          res.data.alltime = res.data.points;
          res.data.recent = res.data.pointsRecent;
          var model = encodeURIComponent(JSON.stringify(res.data));
          wx.navigateTo({
            url: '../detail/index?model=' + model + '&self=true',
          })
        } else {
          wx.showToast({
            title: 'Github 账户不存在',
            icon: 'none',
            duration: 2000
          })
        }
        self.setData({
          loading: false
        });
      }
    })
  },
  goDetail: function (e) {
    var model = encodeURIComponent(JSON.stringify(this.data.ranks[e.currentTarget.id]));
    wx.navigateTo({
      url: '../detail/index?model=' + model + '&self=false',
    })
  },
  goSelf: function (e) {
    var model = encodeURIComponent(JSON.stringify(this.data.model));
    wx.navigateTo({
      url: '../detail/index?model=' + model + '&self=true',
    })
  },
  onShow: function (options) {
    this.setData({
      loading: true,
      rankLoad: false,
      modelLoad: false,
    })
    if (app.globalData.openGId) {
      this.setData({
        motto: '群排行榜',
        openGId: app.globalData.openGId
      })
    } else {
      this.setData({
        motto: 'FCC排行榜',
        openGId: null
      })
    }
    app.openGIdCallback = res => {
      if (res) {
        this.setData({
          motto: '群排行榜',
          openGId: app.globalData.openGId
        })
      } else {
        this.setData({
          motto: 'FCC排行榜',
          openGId: null
        })
      }
      
    }
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        if (res.userInfo!=undefined) {
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
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
    var self = this;
    if (app.globalData.ranks) {
      if (app.globalData.dirty) {
        app.getData();
        app.globalData.dirty = false;
      } else {
        setRanks(app.globalData.ranks);
      }
    } 
    app.dataReadyCallback = res => {
      setRanks(res.data);
    }
    

    function setRanks(data) {
      self.setData({
        ranks: data,
      })
      if (self.data.modelLoad) {
        self.setData({
          loading: false
        })
      } else {
        self.setData({
          rankLoad: true
        })
      }
      if (self.data.model && !self.data.model.rank) {
        var model = self.data.model;

        model.rank = '100+';
        for (var i = 0; i < self.data.ranks.length; i++) {
          if (self.data.ranks[i].openid == model.openid) {
            model.rank = i + 1;
          }
        }
        self.setData({
          model: model
        })
      }
    }

    if (app.globalData.model) {
      setModel(app.globalData.model);
    } else if (app.globalData.model==undefined){
      setModel(null);
    }
    app.openidReadyCallback = res => {
      if (res.statusCode == 500) {
        res.data = null;
      }
      setModel(res.data);
    }

    function setModel(data) {
      if (self.data.rankLoad) {
        self.setData({
          loading: false
        })
      } else {
        self.setData({
          modelLoad: true
        })
      }
      if (data && data.username && self.data.ranks && self.data.ranks.length) {
        data.rank = '100+';
        for (var i = 0; i < self.data.ranks.length; i++) {
          if (self.data.ranks[i].openid == data.openid) {
            data.rank = i + 1;
          }
        }
      }
      self.setData({
        model: data
      })
    }
  },
  getUserInfo: function(e) {
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  }
})
