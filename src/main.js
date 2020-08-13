import Vue from 'vue'
import App from './App.vue'

import VueCesium from 'vue-cesium'

Vue.use(VueCesium, {
  // cesiumPath 是指引用的Cesium.js路径，如
  // 项目本地的Cesium Build包，vue项目需要将Cesium Build包放static目录：
  // cesiumPath: '/Cesium/Cesium.js',
  // 个人在线Cesium Build包：
  // cesiumPath: 'https://zouyaoji.top/vue-cesium/statics/Cesium/Cesium.js',
  // 个人在线SuperMap Cesium Build包（在官方基础上二次开发出来的）：
  // cesiumPath: 'https://zouyaoji.top/vue-cesium/statics/SuperMapCesium/Cesium.js'
  // 官方在线Cesium Build包，有CDN加速，推荐用这个：
  cesiumPath: 'https://unpkg.com/cesium/Build/Cesium/Cesium.js',
  // 指定Cesium.Ion.defaultAccessToken，使用Cesium ion的数据源需要到https://cesium.com/ion/申请一个账户，获取Access Token。不指定的话可能导致 Cesium 在线影像加载不了
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1NGY2YjMyYi0yMzBlLTRmZjktODM2MC1lNGM0YTEwNmQwYzEiLCJpZCI6MzQ0MSwiaWF0IjoxNTM3NTA4NzA0fQ.FPZ0IjCV-iQkqHdMtfVwGzV7tqmAYaxORITjJSQ9mIc'
});

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app')
