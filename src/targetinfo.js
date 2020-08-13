import axios from 'axios'
const url_target = 'http://60.205.185.202:8081/targetinfobysname/%E6%83%B3%E5%AE%9A6'
let TargetModels = []
axios
.get(url_target)
.then(function (response) {
    if (response.data.msg !== 'success') {
        console.log('Receive Error!')
    }
    console.log(response.data);
    for (let i = 0; i < response.data.data.length; i++) {
        const targetdata = response.data.data[i];
        const entityId = targetdata.id;
        const scenarioName = targetdata.scenarioname;
        const targetId = targetdata.targetId;
        const longitude = targetdata.lon;
        const latitude = targetdata.lat;
        const altitude = targetdata.altitude;
        const name = targetdata.targetname;
        const modelType = targetdata.targetclass;
        const targetType = targetdata.targettype;
        const speed = targetdata.speed;
        const degreeHeading = targetdata.heading;
    }

})
