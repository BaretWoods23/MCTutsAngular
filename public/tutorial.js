var app = angular.module("myApp", []);

var renderer, camera, scene, cube, geometry, material, controls;
var size = 16;
var cubes = new THREE.Object3D();
var canvWidth = 1000;
var canvHeight = 800;
var rotationActivated = false;
var cursorX = 500;
var cursorY = 500;
var rotatingRight = false;
var requestURL = "../builds.json"
var request = new XMLHttpRequest();
var buildData;
var stepIndex = 0;

window.onload = function(){
	request.open("GET", requestURL);
	request.responseType = "json";
	request.send();
	var nextButton = document.getElementById("next");
	var prevButton = document.getElementById("previous");
	nextButton.addEventListener("click", function(){
		stepIndex++;
		if(stepIndex == buildData.layers.length-1){
			this.disabled = true;
		}
		prevButton.disabled = false;
		changeLayerVisibility(true);
    });
	prevButton.addEventListener("click", function(){
		nextButton.disabled = false;
		changeLayerVisibility(false);
		stepIndex--;
		if(stepIndex == 0){
			this.disabled = true;
		}
	});
};

function changeLayerVisibility(visible){
	for(var i = 0; i < cubes.children.length; i++){
		if(cubes.children[i].position.y == stepIndex*size){
			cubes.children[i].visible = visible;
		}
	}
};

request.onload = function(){
	var data = request.response;
	var url = window.location.pathname;
	var buildID = url.substr(url.lastIndexOf("/")+1);
	buildData = data.builds[buildID];
	initialize();
	render();
}

function initialize(){
    renderer = new THREE.WebGLRenderer({canvas: document.getElementById("myCanvas"), antialias: true});
    renderer.setClearColor(0x9FD6D9);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvWidth, canvHeight);

    camera = new THREE.PerspectiveCamera(35, canvWidth / canvHeight, 0.1, 5000);
    camera.position.set(800,500,500);
    camera.zoom += 1;
    camera.updateProjectionMatrix();
    controls = new THREE.TrackballControls(camera);
    scene = new THREE.Scene();

    var light1 = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(light1);
    var light2 = new THREE.DirectionalLight(0xffffff);
    light2.position.set(0, 2, 1).normalize;
    scene.add(light2);

    geometry = new THREE.BoxGeometry(size, size, size);

    window.addEventListener("resize", onWindowResize, false);
    document.addEventListener("mousemove", onmousemove, false);
    document.addEventListener("keydown", onDocumentKeyDown, false);
    document.addEventListener("mousedown", onDocumentMouseDown, false);

    scene.add(cubes);
    createBuild();
};

function createBuild(){
	for(var j = 0; j < buildData.layers.length; j++){
		for(var i = 0; i < buildData.layers[j].length; i++){
			var x = buildData.layers[j][i].x;
			var y = buildData.layers[j][i].y;
			var z = buildData.layers[j][i].z;
			var texture = "../" + buildData.layers[j][i].texture;
			cubes.add(getNewMesh(x, y, z, texture));
		}
	}
};

function render(){
    requestAnimationFrame(render);
    renderer.render(scene,camera);
};

function onDocumentMouseDown(event) {
    if(event.button == 1){
        rotationActivated = true;
        if(cursorX > canvWidth/2){
            rotatingRight = true;
        }else if(cursorX < canvWidth/2){
            rotatingRight = false;
        }
    }
};

function onmousemove(event) {
	cursorX = event.clientX;
    cursorY = event.clientY;
};

function onWindowResize() {
    camera.aspect = canvWidth / canvHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvWidth, canvHeight);
};

function getNewMesh(x, y, z, texture){
	var material = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture(texture)});
	material.shininess = 2;
    var newMesh = new THREE.Mesh(geometry, material);
    newMesh.position.set(x, y, z);
	if(y>0){
		newMesh.visible = false;
	}
    return newMesh;
};

function onDocumentKeyDown(event){
    if(!rotationActivated){
        var keyCode = event.which;
        var theta = .03;
        var zoom = 0.5;
        var x = camera.position.x;
        var z = camera.position.z;
        var y = camera.position.y;
        if (keyCode == 37 || keyCode == 65) {
            cubes.position.x -= (x * Math.cos(theta) - z * Math.sin(theta)) - camera.position.x;
            cubes.position.z -= (z * Math.cos(theta) + x * Math.sin(theta)) - camera.position.z;
        }else if(keyCode == 39 || keyCode == 68) {
            cubes.position.x -= (x * Math.cos(theta) + z * Math.sin(theta)) - camera.position.x;
            cubes.position.z -= (z * Math.cos(theta) - x * Math.sin(theta)) - camera.position.z;
        }else if(keyCode == 38 || keyCode == 87) {
            cubes.position.y -= (y * Math.cos(theta*2) + (y * Math.sin(theta*2)/2)) - camera.position.y;
        }else if(keyCode == 40 || keyCode == 83) {
            cubes.position.y -= (y * Math.cos(theta*2) - (y * Math.sin(theta*2)/2)) - camera.position.y;
        }else if(keyCode == 187){
            camera.zoom += zoom;
            camera.updateProjectionMatrix();
        }else if(keyCode == 189 && camera.zoom - zoom > 0){
            camera.zoom -= zoom;
            camera.updateProjectionMatrix();
        }
    }
};

document.onmouseup = function(){
    rotationActivated = false;
};

setInterval(function(){
    if(rotationActivated){
        updateRotation();
    }
}, 50);

function updateRotation(){
    var theta = 0.07;
    var x = camera.position.x;
    var z = camera.position.z;
    if(rotatingRight){
		camera.position.x = x * Math.cos(theta) + z * Math.sin(theta);  
		camera.position.z = z * Math.cos(theta) - x * Math.sin(theta);
		camera.lookAt(scene.position);
    }else{
        camera.position.x = x * Math.cos(theta) - z * Math.sin(theta);
        camera.position.z = z * Math.cos(theta) + x * Math.sin(theta);
        camera.lookAt(scene.position);
    }
}
