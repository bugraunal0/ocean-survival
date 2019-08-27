// global vars
var renderer, camera, scene, light;
var width, height, container;
var hemisphereLight, shadowLight, ambientLight;


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
window.addEventListener('resize', handleWindowResize, false);


function init() {
    createScene();
    createLights();
    createSea();
    // createSky();
    // createPlane();
    // createShip();

    // document.addEventListener('mousemove', handleMousemove, false);

    loop();
}

// FIXME: 
function handleWindowResize() {
    width = window.innerWidth
    height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

function createScene() {
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
function createLights() {
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
        // let geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);
        let geom = new THREE.PlaneGeometry(600, 600, 50, 50);
        // IMP: 连接顶点
        geom.mergeVertices();

        let vnum = geom.vertices.length;
        this.waves = [];
        for (let i = 0; i < vnum; i++) {
            let v = geom.vertices[i];
            this.waves.push({
                x: v.x, 
                y: v.y,
                z: v.z,
                angle: Math.random * Math.PI * 2,
                amplitude: 5 + Math.random() * 15,
                speed: 0.016 + Math.random() * 0.032
            })
        }
        let mat = new THREE.MeshPhongMaterial({
            color: Colors.blue,
            transparent: true,
            opacity: .8, // Phong材质支持透明 TRY: 0.6
            shading: THREE.FlatShading
        });

        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.receiveShadow = true;
    }

    moveWaves() {
        // get the vertices
        let verts = this.mesh.geometry.vertices;
        let l = verts.length;
    
        for (let i = 0; i < l; i++) {
            let v = verts[i];
    
            // get the data associated to it
            let vprops = this.waves[i];
    
            // update the position of the vertex
            v.x = vprops.x + Math.cos(vprops.ang) * vprops.amp;
            v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp;
    
            // increment the angle for the next frame
            vprops.ang += vprops.speed;
    
        }
    
        // Tell the renderer that the geometry of the sea has changed.
        // In fact, in order to maintain the best level of performance, 
        // three.js caches the geometries and ignores any changes
        // unless we add this line
        this.mesh.geometry.verticesNeedUpdate = true;
    
        sea.mesh.rotation.z += .005;
    }
}

var sea;
function createSea() {    
    sea = new Sea();
    // sea.mesh.position.y = -500; // FIXME: originally, -600
    // sea.mesh.rotation.x = -Math.PI / 2;
    scene.add(sea.mesh);
}

// Cloud
class Cloud {
    constructor() {
        this.mesh = new THREE.Object3D();
        let geom = new THREE.SphereGeometry(15);
        let mat = new THREE.MeshPhongMaterial(0xffffff);
        let nBlocs = 3 + Math.floor(Math.random()*3);
        for(let i = 0; i < nBlocs; i++) {
            let m = new THREE.Mesh(geom, mat);
            m.position.x = i * 7;
            m.position.y = Math.random() * 5;
            m.position.z = Math.random() * 5;
            let s = .1 + Math.random() * .9;
            m.scale.set(s,s,s);
            m.castShadow = true;
            m.receiveShadow = true;
            this.mesh.add(m);
        }
    }
}

// Sky
class Sky {
    constructor() {
        this.mesh = new THREE.Object3D();
        this.nClouds = 20;
        this.stepAngle = 2 * Math.PI / this.nClouds;

        // create clouds
        for(let i = 0; i < this.nClouds; i++) {
            let c = new Cloud();
            let a = this.stepAngle * i;
            let h = 800 + Math.random() * 200;
            c.mesh.position.set(
                Math.cos(a) * h,
                Math.sin(a) * h,
                -400 - Math.random() * 400
            );
            c.mesh.rotation.z = a + Math.PI / 2;
            let s = 1 + Math.random() * 2;
            c.mesh.scale.set(s, s, s);
            this.mesh.add(c.mesh);

        }
    }
}

var sky;
function createSky() {
    sky = new Sky();
    sky.mesh.position.y = -600;
    scene.add(sky.mesh);
}

// Plane
class Airplane {
    constructor() {
        this.mesh = new THREE.Object3D();
        // Create the cabin
        let geomCockpit = new THREE.BoxGeometry(60,50,50,1,1,1);
        let matCockpit = new THREE.MeshPhongMaterial({
            color: Colors.red,
            shading: THREE.FlatShading
        });
        let cockpit = new THREE.Mesh(geomCockpit, matCockpit);
        cockpit.castShadow = true;
        cockpit.receiveShadow = true;
        this.mesh.add(cockpit);
        
        // Create the engine
        let geomEngine = new THREE.BoxGeometry(20,50,50,1,1,1);
        let matEngine = new THREE.MeshPhongMaterial({
            color:Colors.white,
            shading:THREE.FlatShading
        });
        let engine = new THREE.Mesh(geomEngine, matEngine);
        engine.position.x = 40;
        engine.castShadow = true;
        engine.receiveShadow = true;
        this.mesh.add(engine);
        
        // Create the tail
        let geomTailPlane = new THREE.BoxGeometry(15,20,5,1,1,1);
        let matTailPlane = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
        let tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
        tailPlane.position.set(-35,25,0);
        tailPlane.castShadow = true;
        tailPlane.receiveShadow = true;
        this.mesh.add(tailPlane);
        
        // Create the wing
        let geomSideWing = new THREE.BoxGeometry(40,8,150,1,1,1);
        let matSideWing = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
        let sideWing = new THREE.Mesh(geomSideWing, matSideWing);
        sideWing.castShadow = true;
        sideWing.receiveShadow = true;
        this.mesh.add(sideWing);
        
        // propeller
        let geomPropeller = new THREE.BoxGeometry(20,10,10,1,1,1);
        let matPropeller = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
        this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
        this.propeller.castShadow = true;
        this.propeller.receiveShadow = true;
        
        // blades
        let geomBlade = new THREE.BoxGeometry(1,100,20,1,1,1);
        let matBlade = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});
        
        let blade = new THREE.Mesh(geomBlade, matBlade);
        blade.position.set(8,0,0);
        blade.castShadow = true;
        blade.receiveShadow = true;
        this.propeller.add(blade);
        this.propeller.position.set(50,0,0);
        this.mesh.add(this.propeller);
    }
}

var airplane;
function createPlane() {
    airplane = new Airplane();
    airplane.mesh.scale.set(.25,.25,.25);
    airplane.mesh.position.set(-50, 200, -100);
    scene.add(airplane.mesh);
}   

function updatePlane() {
    // let's move the airplane between -100 and 100 on the horizontal axis, 
    // and between 25 and 175 on the vertical axis,
    // depending on the mouse position which ranges between -1 and 1 on both axes;
    // to achieve that we use a normalize function (see below)
    
    var targetX = normalize(mousePos.x, -1, 1, -150, 150);
    var targetY = normalize(mousePos.y, -1, 1, 150, 300);

    // update the airplane's position
    // airplane.mesh.position.x = targetX;
    // airplane.mesh.position.y = targetY;
    // airplane.propeller.rotation.x += 0.3;

}

function normalize(v, vmin, vmax, tmin, tmax) {
    let nv = Math.max(Math.min(v, vmax), vmin);
    let dv = vmax - vmin;
    let pc = (nv - vmin) / dv;
    let dt = tmax - tmin;
    let tv = tmin + (pc * dt);
    return tv;
}

var mousePos = {x: 0, y: 0};
function handleMousemove(event) {
    // here we are converting the mouse position value received 
    // to a normalized value varying between -1 and 1;
    // this is the formula for the horizontal axis:    
    mousePos.x = -1 + (event.clientX / width) * 2;

    // for the vertical axis, we need to inverse the formula 
    // because the 2D y-axis goes the opposite direction of the 3D y-axis
    mousePos.y = 1 - (event.clientY / height) * 2;
}

// Animation Loop
function loop() {
    // sky.mesh.rotation.z += .002;
    sea.moveWaves();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
}

// Legacy
function initObject() {
    // 地面网格
    let lineGeometry = new THREE.Geometry();
    let lineMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa });

    lineGeometry.vertices.push(new THREE.Vector3(-500, 0, 0));
    lineGeometry.vertices.push(new THREE.Vector3(500, 0, 0));

    for (let i = 0; i <= 20; i++) {
        let line = new THREE.Line(lineGeometry, lineMaterial);
        line.position.z = i * 50 - 500;
        scene.add(line);

        line = new THREE.Line(lineGeometry, lineMaterial);
        line.position.x = i * 50 - 500;
        line.rotation.y = Math.PI / 2;
        scene.add(line);
    }

    // 立方体
    let cubeGeometry = new THREE.CubeGeometry(100, 100, 100, 4, 4);
    let cubeMaterial = new THREE.MeshLambertMaterial(0x00ffff);
    // let cubeMat = new THREE.MeshBasicMaterial(0x000000);
    cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(0, 50, 0);
    // cube.rotation.set(0.5, 0.5, 0.5);
    cube.castShadow = true;
    scene.add(cube);

    // 平面
    let planeGeometry = new THREE.PlaneGeometry(1000, 1000);
    let planeMaterial = new THREE.MeshStandardMaterial(0xffffff);
    let plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.lookAt(0, 1, 0);
    // 接受阴影
    plane.receiveShadow = true;
    scene.add(plane);
}