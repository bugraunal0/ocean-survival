/*
* game.js
* author: Censyu
*
* TODO:
* fix camera bugs
* add ship models (OK) -> beautify the model
* add kb & mouse controls
*/

// global vars
var renderer, camera, scene, light;
var width, height;
var hemisphereLight, shadowLight, ambientLight;
var sea;
var progEnable = true;

var Colors = {
    red: 0xf25346,           // #f25346
    white: 0xd8d0d1,         // #d8d0d1
    brown: 0x59332e,         // #59332e
    pink: 0xF5986E,          // #F5986E
    brownDark: 0x23190f,     // #23190f
    blue: 0x68c3c0,          // #68c3c0
};

// window events
window.addEventListener('load', init, false);
window.addEventListener('resize', onWindowResize, false);


function init() {
    progbar.css("width", "20%");
    initScene();
    initLights();
    initSea();
    initBoat();
    loop();
}

function onWindowResize() {
    width = window.innerWidth
    height = window.innerHeight;
    camera.left = width / - 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = height / - 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function initScene() {
    width = window.innerWidth
    height = window.innerHeight;

    // Scene
    scene = new THREE.Scene();
    // scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

    // Camera
    camera = new THREE.OrthographicCamera(
        width / -2,
        width / 2,
        height / 2,
        height / -2,
        1,
        1000
    );

    camera.position.set(100, -200, 200);
    camera.rotation.set(Math.PI / 4, 0, Math.PI / 8);

    // camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({
        alpha: true,        // 透明背景
        antialias: true     // 抗锯齿
    });
    renderer.setSize(width, height);

    // 开启阴影渲染
    renderer.shadowMap.enabled = true;

    // 添加
    document
        .getElementById("main-scene")
        .appendChild(renderer.domElement);
}

// Lights
function initLights() {
    // 半球光 (天空色, 地面色, 光强)
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .8);

    // 平行光 - 投射阴影
    shadowLight = new THREE.DirectionalLight(0xffffff, .5);
    shadowLight.position.set(0, 0, 350);
    shadowLight.castShadow = true;

    // 阴影可见区域
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    // 分辨率
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;
    
    scene.add(hemisphereLight);
    scene.add(shadowLight);

    // 环境光照
    ambientLight = new THREE.AmbientLight(0xdc8874, .5);
    scene.add(ambientLight);
}

// Sea
class Sea {
    constructor() {
        let geom = new THREE.PlaneGeometry(600, 600, 7, 7);
        // IMP: combine the vertices
        geom.mergeVertices();

        this.waves = [];
        let vnum = geom.vertices.length;
        for (let i = 0; i < vnum; i++) {
            this.waves.push({
                ang: Math.random() * Math.PI * 2,
                amp: 0.5 + Math.random() * 0.01,
                speed: 0.016 + Math.random() * 0.032
            })
        }
        let mat = new THREE.MeshPhongMaterial({
            color: Colors.blue,
            transparent: true,
            opacity: .8, // Phong 材质支持透明 TRY: 0.6
            shading: THREE.FlatShading
        });

        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.receiveShadow = true;
    }

    moveWaves() {
        let verts = this.mesh.geometry.vertices;
        let l = verts.length;
        
        for (let i = 0; i < l; i++) {
            let vprops = this.waves[i];
            verts[i].z += Math.cos(vprops.ang) * vprops.amp;
            vprops.ang += vprops.speed;
        }

        this.mesh.geometry.verticesNeedUpdate = true;
    }
}

function initSea() {    
    sea = new Sea();
    sea.mesh.position.set(0, 0, 0);
    scene.add(sea.mesh);
}

// Boat
var boat;
function initBoat() {
    let loader = new THREE.GLTFLoader();
    loader.load('./src/boat.gltf', function (gltf) {
        boat = gltf.scene;
        boat.rotation.set(0, Math.PI, 0);
        scene.add(gltf.scene);
    }, undefined, function(error){
        console.log('.gltf error:' + error);
        });
    console.log(boat);
    // boat.rotation.set(0, Math.PI / 4, 0);
}

function loadGLTF(path) {
    let loader = new THREE.GLTFLoader();
    loader.load(path, function (gltf){
        scene.add(gltf.scene);
    }, undefined, function(error){
        console.log('.gltf error:' + error);
    });
}

// Animation Loop
function loop() {
    sea.moveWaves();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
}

// Legacy
// function initObject() {
//     // 地面网格
//     let lineGeometry = new THREE.Geometry();
//     let lineMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa });

//     lineGeometry.vertices.push(new THREE.Vector3(-500, 0, 0));
//     lineGeometry.vertices.push(new THREE.Vector3(500, 0, 0));

//     for (let i = 0; i <= 20; i++) {
//         let line = new THREE.Line(lineGeometry, lineMaterial);
//         line.position.z = i * 50 - 500;
//         scene.add(line);

//         line = new THREE.Line(lineGeometry, lineMaterial);
//         line.position.x = i * 50 - 500;
//         line.rotation.y = Math.PI / 2;
//         scene.add(line);
//     }

//     // 立方体
//     let cubeGeometry = new THREE.CubeGeometry(100, 100, 100, 4, 4);
//     let cubeMaterial = new THREE.MeshLambertMaterial(0x00ffff);
//     // let cubeMat = new THREE.MeshBasicMaterial(0x000000);
//     cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
//     cube.position.set(0, 50, 0);
//     // cube.rotation.set(0.5, 0.5, 0.5);
//     cube.castShadow = true;
//     scene.add(cube);

//     // 平面
//     let planeGeometry = new THREE.PlaneGeometry(1000, 1000);
//     let planeMaterial = new THREE.MeshStandardMaterial(0xffffff);
//     let plane = new THREE.Mesh(planeGeometry, planeMaterial);
//     plane.lookAt(0, 1, 0);
//     // 接受阴影
//     plane.receiveShadow = true;
//     scene.add(plane);
// }