/*
* game.js
* @author: Censyu
*
* TODO:
* fix camera bugs
* add ship models (OK) -> beautify the model
* add kb & mouse controls
*
* FIXME:
* broken .gltf model
*
* HINT:
* mind out the async scheme of FBXLoader
*     (the model will be loaded later), not instantly!
* promise is not useful when the callback function has its own callback function!
*/

// global vars
var renderer, camera, scene, light;
var width, height;
var hemisphereLight, shadowLight, ambientLight;
var sea;
var progEnable = false;

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
    if (progEnable) {
        progbar.css("width", "20%");
    }
    initScene();
    initLights();
    initSea();
    initBoat();
    initAxis();
    if (!progEnable) {
        $(".progress").css("visibility", "hidden");
        $(".progress").css("opacity", "0");
        $("#main-scene canvas").css("visibility", "visible");
        $("#main-scene canvas").css("opacity", "1");
    }

    loop();
}

// Animation Loop
function loop() {
    sea.moveWaves();
    renderer.render(scene, camera);
    syncCamera();
    requestAnimationFrame(loop);
}

function initAxis() {
    let geomX = new THREE.Geometry();
    let geomY = new THREE.Geometry();
    let geomZ = new THREE.Geometry();
    let matR = new THREE.LineBasicMaterial({color: 0xff0000});
    let matG = new THREE.MeshBasicMaterial({color: 0x00ff00});
    let matB = new THREE.MeshBasicMaterial({color: 0x0000ff});

    geomX.vertices.push(new THREE.Vector3(0, 0, 0));
    geomX.vertices.push(new THREE.Vector3(700, 0, 0));
    geomY.vertices.push(new THREE.Vector3(0, 0, 0));
    geomY.vertices.push(new THREE.Vector3(0, 700, 0));
    geomZ.vertices.push(new THREE.Vector3(0, 0, 0));
    geomZ.vertices.push(new THREE.Vector3(0, 0, 700));

    scene.add(new THREE.Line(geomX, matR));
    scene.add(new THREE.Line(geomY, matG));
    scene.add(new THREE.Line(geomZ, matB));
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

    camera.position.set(0, -500, 200);
    camera.rotation.set(1.5, 0, 0);

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
        let geom = new THREE.PlaneGeometry(1000, 1000, 7, 7);
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
    // loadGLTF('./src/boat.gltf', 'boat');
    // FIXME: async starts here!
    loadFBX('./src/boat.fbx', 'boat');    
}

// Boat Control (w87 s83 a65 d68 space32)
$(document).keydown(function (event) {
    if (boat) {
        console.log(event);
        if (event.keyCode == 87) {
            boat.translateX(5);
        }
        if (event.keyCode == 83) {
            boat.translateX(-5);
        }
        if (event.keyCode == 65) {
            boat.rotation.y -= .05;
        }
        if (event.keyCode == 68) {
            boat.rotation.y += .05;
        }
    }
    else {
        boat = scene.getObjectByName('boat');
        console.log(boat);
    }
});

// Camera Control
function syncCamera() {
    camera.position.set($('#posX').val(), $('#posY').val(), $('#posZ').val());
    camera.rotation.set($('#rotX').val() / 100, $('#rotY').val() / 100, $('#rotZ').val() / 100);
    camera.updateProjectionMatrix();
}

// Model loader
function loadFBX(path, name) {
    let loader = new THREE.FBXLoader();
    loader.load(path, function (fbx) {
        // >for animation...
        // object.mixer = new THREE.AnimationMixer(object);
        // mixers.push(object.mixer);

        // var action = object.mixer.clipAction(object.animations[0]);
        // action.play();

        // object.traverse( function (child) {
        //     if (child.isMesh) {
        //         child.castShadow = true;
        //         child.receiveShadow = true;
        //     }
        // });

        // Customized settings here
        fbx.name = name;
        fbx.rotation.set(-Math.PI / 2, 0, 0);
        fbx.castShadow = true;
        scene.add(fbx);
        // IMP: take care of the async scheme!!!
    },
    // called while loading is progressing
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    // called when loading has errors
    function (error) {
        console.log( 'An error happened' );
    });
}

function loadGLTF(path, name) {
    let loader = new THREE.GLTFLoader();
    loader.load(path, function (gltf) {
        gltf.scene.rotation.set(0, Math.PI, 0);
        gltf.scene.name = name;
        scene.add(gltf.scene);
    }, undefined, function(error){
        console.log('.gltf error:' + error);
        });
    
}