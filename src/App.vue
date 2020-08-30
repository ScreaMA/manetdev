<template>
  <div id="app">
    <div class="vcViewer">
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
    <div class="demoTools">
      <el-col :span="3">
        <div>预计通信半径</div>
      </el-col>
      <el-col :span="3" >
        <el-input v-model='input' size="mini" placeholder="20000" ref="Radius" @blur="updateConfigs" clearable></el-input>
      </el-col>
      <el-col :span="3" :offset="1">
        <div>切换颜色</div>
      </el-col>
      <el-col :span="1">
        <select ref="RadiusColor" @mouseleave="updateConfigs2">
          <option value="RED">红色</option>
          <option value="GREEN">绿色</option>
          <option value="GOLD">金色</option>
          <option value="HOTPINK">粉色</option>
          <option value="AQUA">蓝色</option>
          <option value="CHARTREUSE">棕色</option>
        </select>
      </el-col>
    </div>
    <div class="linkStatus">
      <el-table :data="tableData">
        <el-table-column
                prop="reqtime"
                label="时间">
        </el-table-column>
        <el-table-column
                prop="srcTarget"
                label="信源">
        </el-table-column>
        <el-table-column
                prop="dstTarget"
                label="信宿">
        </el-table-column>
        <el-table-column
                prop="success"
                label="状态">
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
  import axios from 'axios'
  import 'vue-cesium/lib/vc-navigation.css'
  let countX=0 ,countY=0 ;
  let TargetModels =[];
  let currentScenario;
  /*
function getAngle(lng1, lat1, lng2, lat2) {
  let dRotateAngle = Math.atan2(Math.abs(lng2 - lng1), Math.abs(lat2 - lat1));
  if (lng2 >= lng1) {
    if (lat2 > lat1) {
      dRotateAngle = 2 * Math.PI - dRotateAngle;
    }
  } else {
    if (lat2 >= lat1) {
      dRotateAngle = Math.PI + dRotateAngle;
    } else {
      dRotateAngle = Math.PI - dRotateAngle;
    }
  }
  dRotateAngle = dRotateAngle * 180 / Math.PI;
  return dRotateAngle;
}

   */
  /*
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

  // Converts from radians to degrees.
function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

function bearing(startLat, startLng, destLat, destLng){
    startLat = toRadians(startLat);
    startLng = toRadians(startLng);
    destLat = toRadians(destLat);
    destLng = toRadians(destLng);

    let y = Math.sin(destLng - startLng) * Math.cos(destLat);
    let x = Math.cos(startLat) * Math.sin(destLat) - Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
    let brng = Math.atan2(y, x);
    let brngDgr = toDegrees(brng);
    return (brngDgr + 360) % 360;
  }
   */

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
            lng: 130.86,
            lat: 26.28,
            height: 1000000
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
              lng: 130.86, lat: 26.28, height: 1000000, heading: 360, pitch: -90, roll: 0
            },
            overrideCamera: false
          },
          enableDistanceLegend: true,
          enableLocationBar: true,
          enableCompassOuterRing: true,
          enablePrintView: false,
          enableMyLocation: false,
        },
        tableData: [],
        input: ''
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
        const url_scenarios = '/data/targetinfobysname_4';
        let url_targets;
        axios
        .get(url_scenarios)
        .then((response) => {
          currentScenario = response.data.data;
          currentScenario = ['想定4'];
          for (let i=0;i<currentScenario.length;i++){
            // const tempScenario = currentScenario[i];
            url_targets = '/data/targetinfobysname_4';
            console.log(url_targets);
            axios
                    .get(url_targets)
                    .then((response) => {
                      if (response.data.msg !== 'success') {
                        console.log('Receive Error!')
                      }
                      console.log(response.data.data);
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
                        let teamColor,modelId;
                        const team = targetData.team;
                        if (team){
                          teamColor = Cesium.Color.BLUE;
                          modelId = 'B'
                        }else {
                          teamColor = Cesium.Color.RED;
                          modelId = 'R'
                        }
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
                        let hpr = new Cesium.HeadingPitchRoll(Heading, 0, 0);
                        if (modelType === 1) hpr = new Cesium.HeadingPitchRoll(Heading, 0, 0);
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
                            fillColor: teamColor,
                            font: '20px sans-serif',
                            horizontalOrigin: 1,
                            outlineColor: Cesium.Color.BLACK,
                            outlineWidth: 2,
                            pixelOffset: new Cesium.Cartesian2(20, -6),
                            style: Cesium.LabelStyle.FILL,
                            scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2, 8.0e5, 0.4),
                            translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 1, 8.0e5, 0.7),
                            show: modelShow
                          }),
                          model: new Cesium.ModelGraphics({
                            uri: url_sources + '/models/glb/' + modelId + modelType.toString() + 'S' + '1' + '.glb',
                            maximumScale: 20000,
                            minimumPixelSize: 64,
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
                          }),
                          modelType: modelType
                        })
                      }
                      //Interval
                      setInterval(function () {
                        const url_targetsUpdate = '/data/reviewTargetTrace_';
                        axios
                                .get(url_targetsUpdate + countX)
                                .then(function (response) {
                                  countX +=1;
                                  if (countX===100) countX=0;
                                  if (response.data.msg !== 'success') {
                                    console.log('Receive Error!')
                                  }
                                  // console.log(response.data.data);
                                  for (let i = 0; i < response.data.data.length; i++){
                                    const targetUpdate = response.data.data[i];
                                    const targetId = targetUpdate.targetId;
                                    const latitudeUpdate = targetUpdate.latitude;
                                    const altitudeUpdate = targetUpdate.altitude;
                                    const longitudeUpdate = targetUpdate.longtitude;
                                    const targetData = TargetModels[currentScenario[0]][targetId];
                                    const entityId = targetData.id;
                                    let temp = viewer.entities.getById(entityId);
                                    /*
                                    let prePosition, currentHeading, currentPosition, currentHPR,currentOrientation,preCarto, longitudePre, latitudePre;
                                    prePosition = temp._position._value;
                                    //console.log(temp);
                                    temp.position = Cesium.Cartesian3.fromDegrees(longitudeUpdate, latitudeUpdate, altitudeUpdate);
                                    currentPosition = temp._position._value;
                                    preCarto = Cesium.Cartographic.fromCartesian(prePosition);
                                    longitudePre = Cesium.Math.toDegrees(preCarto.longitude);
                                    latitudePre = Cesium.Math.toDegrees(preCarto.latitude);
                                    console.log(longitudePre,latitudePre,longitudeUpdate,latitudeUpdate);
                                    currentHeading = bearing(longitudePre,latitudePre,longitudeUpdate,latitudeUpdate);
                                    // currentHeading = currentHeading * Cesium.Math.DEGREES_PER_RADIAN;
                                    console.log(currentHeading);
                                    if (temp.modelType === 1) currentHPR = new Cesium.HeadingPitchRoll(currentHeading,0,135 );
                                      else currentHPR = new Cesium.HeadingPitchRoll(currentHeading,0,0 );
                                    currentOrientation = Cesium.Transforms.headingPitchRollQuaternion(currentPosition,currentHPR);
                                    temp.orientation = currentOrientation;
                                    */
                                    const labelUpdate = targetData.targetname +' (' + longitudeUpdate + ',' + latitudeUpdate + ',' + altitudeUpdate + ')';
                                    temp.label.text = labelUpdate;
                                    temp.name = labelUpdate;
                                  }
                                  console.log('target update over')
                                })
                                .catch(function (error) {
                                  console.log(error)
                                })
                      },1000)
                      // Battle Situation
                      setInterval(function () {
                        const url_targetsUpdate = '/data/reviewTargetTrace_';
                        axios
                                .get(url_targetsUpdate + countX)
                                .then(function (response) {
                                  countX +=1;
                                  if (countX===100) countX=0;
                                  if (response.data.msg !== 'success') {
                                    console.log('Receive Error!')
                                  }
                                  // console.log(response.data.data);
                                  for (let i = 0; i < response.data.data.length; i++){
                                    const targetUpdate = response.data.data[i];
                                    const targetId = targetUpdate.targetId;
                                    const latitudeUpdate = targetUpdate.latitude;
                                    const altitudeUpdate = targetUpdate.altitude;
                                    const longitudeUpdate = targetUpdate.longtitude;
                                    const targetData = TargetModels[currentScenario[0]][targetId];
                                    const entityId = targetData.id;
                                    let temp = viewer.entities.getById(entityId);
                                    const labelUpdate = targetData.targetname +' (' + longitudeUpdate + ',' + latitudeUpdate + ',' + altitudeUpdate + ')';
                                    temp.label.text = labelUpdate;
                                    temp.name = labelUpdate;
                                  }
                                  console.log('target update over')
                                })
                                .catch(function (error) {
                                  console.log(error)
                                })
                      },1000)

                      setInterval(()=> {
                        const url_linksUpdate = '/data/JXCommunicationReponse_';
                        axios
                        .get(url_linksUpdate + countY)
                        .then((response) => {
                          countY+=1;
                          if (countY===100) countY=0;
                          if (response.data.msg !== 'success') {
                            console.log('Receive Error!')
                          }
                          // console.log(response.data.data);
                          for (let i = 0;i<30;i++)
                            for (let j = 0;j<30;j++)
                            {
                              let entityID = i + '-' + j;
                              let tempEntity = viewer.entities.getById(entityID);
                              if (tempEntity){
                                viewer.entities.removeById(entityID)
                              }
                            }
                          for (let i = 0; i < response.data.data.length; i++){
                            const linkList = response.data.data[i].commResultList;
                            for (let j=0;j<linkList.length;j++){
                              const linkData = linkList[j];
                              const srcTarget = linkData.sourceTargetId;
                              const dstTarget = linkData.destinationTargetId;
                              const reqTime = countY;
                              const linkEntityId = srcTarget + '-' + dstTarget;
                              const linkDelay = linkData.delayTime;
                              const status = linkData.resultCode;
                              let statusText;
                              let linkColor;
                              if (status){
                                linkColor = Cesium.Color.GREEN;
                                statusText = '成功';
                              }else {
                                linkColor = Cesium.Color.RED;
                                statusText = '失败';
                              }
                              let temp;
                              temp = viewer.entities.getById(linkEntityId);
                              if (temp) viewer.entities.removeById(linkEntityId);
                              viewer.entities.add({
                                name: 'link' + linkData.dataNo + reqTime,
                                id: linkEntityId,
                                polyline: {
                                  positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                                    TargetModels[currentScenario[0]][srcTarget].lon,
                                    TargetModels[currentScenario[0]][srcTarget].lat,
                                    TargetModels[currentScenario[0]][srcTarget].altitude,
                                    TargetModels[currentScenario[0]][dstTarget].lon,
                                    TargetModels[currentScenario[0]][dstTarget].lat,
                                    TargetModels[currentScenario[0]][dstTarget].altitude
                                  ]),
                                  label: new Cesium.LabelGraphics({
                                    text: linkDelay,
                                    fillColor: Cesium.Color.GOLD,
                                    font: '20px sans-serif',
                                    horizontalOrigin: 1,
                                    outlineColor: Cesium.Color.BLACK,
                                    outlineWidth: 2,
                                    pixelOffset: new Cesium.Cartesian2(20, -6),
                                    style: Cesium.LabelStyle.FILL,
                                    scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1, 8.0e5, 0.3),
                                    translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 1, 8.0e5, 0.1),
                                  }),
                                  width: 5,
                                  material: new Cesium.PolylineDashMaterialProperty({
                                    color: linkColor
                                  })
                                }
                              });
                              const itemData = {
                                reqtime: reqTime,
                                srcTarget: srcTarget,
                                dstTarget: dstTarget,
                                success: statusText
                              };
                              this.tableData.push(itemData);
                              if (this.tableData.length>10) this.tableData.shift();
                            }
                            /*
                            const srcTarget = linkData.srcTargetId;
                            const dstTarget = linkData.dstTargetId;
                            const reqTime = linkData.reqtime;
                            const status = linkData.success;
                            const linkDelay =linkData.delay;
                             */

                          }
                          console.log('link update over')
                        })
                        .catch(function (error) {
                          console.log(error)
                          console.log('linkwrong')
                        })
                      },1000)
                    })
            .catch(function (error) {
              console.log(error)
            });

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
        console.log(TargetModels);
        console.log(currentScenario);
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
  .el-col{
    border-radius: 4px;
  }
.vcViewer{
  width: 100%;
  height: 100%;
}
  .demoTools{
    position: absolute;
    top: 20px;
    left: 20px;
    width: 50%;
    font-family: "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif;
    color: aliceblue;
  }
  .linkStatus{
    position: absolute;
    right: 20px;
    top: 30%;
    color: aliceblue;
    width: 20%;
    height: 60%;
    font-family: "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif;
  }
</style>
