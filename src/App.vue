<template>
  <div id="app">
    <span> 估计通信半径 </span>
    <input value="20000" ref="Radius" @mouseleave="updateConfigs">
    <span> 切换颜色 </span>
    <select ref="RadiusColor" @mouseleave="updateConfigs2">
      <option value="RED">红色</option>
      <option value="GREEN">绿色</option>
      <option value="GOLD">金色</option>
      <option value="HOTPINK">粉色</option>
      <option value="AQUA">蓝色</option>
      <option value="CHARTREUSE">棕色</option>
    </select>
    <vc-viewer
            class="viewer"
            :animation="animation"
            :timeline="timeline"
            :base-layer-picker="baseLayerPicker"
            :camera.sync="camera"
            :scene-mode-picker="sceneModePicker"
            :navigation-help-button="homeButton"
            @ready="ready"
    >
      <vc-navigation :options="options" />
      <vc-layer-imagery :imagery-provider="imageryProvider" />
      <vc-provider-terrain-cesium :terrain-provider="terrainProvider" />
    </vc-viewer>
  </div>
</template>

<script>
  import axios from 'axios'
  import 'vue-cesium/lib/vc-navigation.css'
  let TargetModels =[];
  let currentScenario;
  export default {
    data() {
      return {
        animation: false,
        timeline: false,
        baseLayerPicker: true,
        sceneModePicker: true,
        homeButton: true,
        camera: {
          position: {
            lng: 120.65,
            lat: 25.64,
            height: 70000
          },
          heading: 360,
          pitch: -90,
          roll: 0
        },
        show: true,
        MapStyle: 'cva_c',
        imageryProvider: {},
        terrainProvider: {},
        options: {
          enableCompass: true,
          enableZoomControl: {
            // 缩放比例
            zoomAmount: 2,
            // 用于在使用重置导航重置地图视图时设置默认视图控制。接受的值是经纬度{lng: number, lat: number, height: number}或者 rectangle{west: number,south: number,east: number,north: number}
            defaultResetView: {
              lng: 120.65, lat: 25.64, height: 70000, heading: 360, pitch: -90, roll: 0
            },
            overrideCamera: false
          },
          enableDistanceLegend: true,
          enableLocationBar: true,
          enableCompassOuterRing: true,
          enablePrintView: false,
          enableMyLocation: false,
        }
      }
    },
    methods: {
      ready(cesiumInstance) {
        const { Cesium, viewer } = cesiumInstance;
        this.cesiumInstance = cesiumInstance;
        const url_sources = 'http://manet.synology.me:4003';
        this.imageryProvider = new Cesium.UrlTemplateImageryProvider({
          url: url_sources + '/maptile/{z}/{x}/{y}.jpg',
          fileExtension: 'jpg'
        });
        this.terrainProvider = new Cesium.CesiumTerrainProvider(
                {
                  url: url_sources + '/terrain/'
                }
        );
        let terrainViewModels = [];
        terrainViewModels.push(new Cesium.ProviderViewModel({
          name: 'WGS84 Ellipsoid',
          iconUrl: Cesium.buildModuleUrl('Widgets/Images/TerrainProviders/Ellipsoid.png'),
          tooltip: 'WGS84 standard ellipsoid, also known as EPSG:4326',
          category: '卫星测量',
          creationFunction: function() {
            return new Cesium.EllipsoidTerrainProvider()
          }
        }));
        terrainViewModels.push(new Cesium.ProviderViewModel({
          name: '测试用离线地形',
          iconUrl: Cesium.buildModuleUrl('Widgets/Images/TerrainProviders/CesiumWorldTerrain.png'),
          tooltip: '水经注下载离线高程',
          category: '卫星测量',
          creationFunction: function() {
            return new Cesium.CesiumTerrainProvider({
              url: url_sources + '/terrain/'
            })
          }
        }));
        let imageryViewModels = [];
        imageryViewModels.push(new Cesium.ProviderViewModel({
          name: '离线地图',
          iconUrl: Cesium.buildModuleUrl('Widgets/Images/ImageryProviders/openStreetMap.png'),
          tooltip: '水经注离线下载',
          category: '国内常用',
          creationFunction: function() {
            return new Cesium.UrlTemplateImageryProvider({
              url: url_sources + '/maptile/{z}/{x}/{y}.jpg',
              fileExtension: 'jpg'
            })
          }
        }));
        imageryViewModels.push(new Cesium.ProviderViewModel({
          name: '离线海图',
          iconUrl: Cesium.buildModuleUrl('Widgets/Images/ImageryProviders/openStreetMap.png'),
          tooltip: '水经注离线下载',
          category: '国内常用',
          creationFunction: function() {
            return new Cesium.UrlTemplateImageryProvider({
              url: url_sources + '/nauticaltile/{z}/{x}/{y}.jpg',
              fileExtension: 'jpg'
            })
          }
        }));
        viewer.baseLayerPicker.viewModel.imageryProviderViewModels = imageryViewModels;
        viewer.baseLayerPicker.viewModel.terrainProviderViewModels = terrainViewModels;
        const url_scenarios = 'http://60.205.185.202:8889/JXLoadScenarioParam';
        let url_targets;
        axios
        .get(url_scenarios)
        .then(function (response) {
          currentScenario = response.data.data;
          for (let i=0;i<currentScenario.length;i++){
            const tempScenario = currentScenario[i];
            url_targets = 'http://60.205.185.202:8081/targetinfobysname/' + tempScenario;
            console.log(url_targets)
            axios
                    .get(url_targets)
                    .then(function (response) {
                      if (response.data.msg !== 'success') {
                        console.log('Receive Error!')
                      }
                      for (let i = 0; i < response.data.data.length; i++) {
                        const targetData = response.data.data[i];
                        const entityId = targetData.id;
                        const scenarioName = targetData.scenarioname;
                        const targetId = targetData.targetId;
                        const longitude = targetData.lon;
                        const latitude = targetData.lat;
                        const altitude = targetData.altitude;
                        const name = targetData.targetname;
                        const modelType = targetData.targetclass;
                        let modelShow = true;
                        // const targetType = targetData.targettype;
                        // const speed = targetData.speed;
                        const DegreesHeading = targetData.heading;
                        const ellipsoidRadius = 7000;
                        const label = name + ' (' + longitude + ',' + latitude + ',' + altitude + ')';
                        const targetPosition = Cesium.Cartesian3.fromDegrees(
                                longitude,
                                latitude,
                                altitude
                        );
                        const Heading = Cesium.Math.toRadians(DegreesHeading);
                        const hpr = new Cesium.HeadingPitchRoll(Heading, 0, 135);
                        const targetOrientation = Cesium.Transforms.headingPitchRollQuaternion(
                                targetPosition,
                                hpr
                        );
                        if (!TargetModels[scenarioName])
                          TargetModels[scenarioName]=[];
                        TargetModels[scenarioName][targetId] = targetData;
                        viewer.entities.add({
                          name: label,
                          id: entityId,
                          position: targetPosition,
                          orientation: targetOrientation,
                          label: new Cesium.LabelGraphics({
                            text: label,
                            fillColor: Cesium.Color.GOLD,
                            font: '20px sans-serif',
                            horizontalOrigin: 1,
                            outlineColor: Cesium.Color.BLACK,
                            outlineWidth: 2,
                            pixelOffset: new Cesium.Cartesian2(20, -6),
                            style: Cesium.LabelStyle.FILL,
                            scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2, 8.0e5, 0.4),
                            translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 1, 8.0e5, 0.2),
                            show: modelShow
                          }),
                          model: new Cesium.ModelGraphics({
                            uri: url_sources + '/models/model' + modelType.toString() + '.gltf',
                            maximumScale: 20000,
                            minimumPixelSize: 50,
                            runAnimations: false,
                            show: modelShow
                          }),
                          ellipsoid: new Cesium.EllipsoidGraphics({
                            radii: new Cesium.Cartesian3(ellipsoidRadius, ellipsoidRadius, ellipsoidRadius),
                            material: Cesium.Color.RED.withAlpha(0.2),
                            outline: true,
                            fill: false,
                            outlineColor: Cesium.Color.CRIMSON,
                            show: modelShow
                          })
                        })
                      }
                    })
            .catch(function (error) {
              console.log(error)
            })
          }
        })
        .catch(function (error) {
          console.log(error)
        })
        .finally(function () {
          console.log('Scenarios Set')
          console.log(currentScenario)
        });





      },updateConfigs(){
        const {  Cesium, viewer } = this.cesiumInstance;
        const radius = this.$refs.Radius.value;
        console.log(TargetModels)
        console.log(currentScenario)
        for (let j=0;j<currentScenario.length;j++){
          let scenarioName = currentScenario[j];
          let temp = TargetModels[scenarioName];
          for (let i=0;i<temp.length;i++) {
            const targetData = temp[i];
            const entityId = targetData.id;
            let temp2 = viewer.entities.getById(entityId);
            temp2._ellipsoid.radii = new Cesium.Cartesian3(radius, radius, radius)
          }
        }
        console.log('updateRadius');
      },
      updateConfigs2(){
        const { Cesium, viewer } = this.cesiumInstance;
        const RadiusColor = this.$refs.RadiusColor.value;
        console.log(TargetModels)
        console.log(currentScenario)
        let EntityColor;
        if (RadiusColor === 'RED') EntityColor = Cesium.Color.RED;
        if (RadiusColor === 'GOLD') EntityColor = Cesium.Color.GOLD;
        if (RadiusColor === 'GREEN') EntityColor = Cesium.Color.GREEN;
        if (RadiusColor === 'AQUA') EntityColor = Cesium.Color.AQUA;
        if (RadiusColor === 'CHARTREUSE') EntityColor = Cesium.Color.CHARTREUSE;
        if (RadiusColor === 'HOTPINK') EntityColor = Cesium.Color.HOTPINK;
        for (let j=0;j<currentScenario.length;j++){
          let scenarioName = currentScenario[j];
          let temp = TargetModels[scenarioName];
          for (let i=0;i<temp.length;i++) {
            const targetData = temp[i];
            const entityId = targetData.id;
            let temp2 = viewer.entities.getById(entityId);
            temp2._ellipsoid.outlineColor = EntityColor
          }
        }
        console.log('updateColor');
      }
    }}
</script>

<style>

</style>
