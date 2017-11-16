var app = angular.module("myApp", []);

var renderer, camera, scene, cube, geometry, material, controls;
var size = 16;
var cubes = new THREE.Object3D();
var fencing = new THREE.Object3D();
var canvWidth = 1000;
var canvHeight = 600;
var rotationActivated = false;
var cursorX = 500;
var cursorY = 500;
var rotatingRight = false;
var request = new XMLHttpRequest();
var buildData, layerData;
var stepIndex = 0, layerIndex = 0;

app.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
});

window.onload = function(){
	var url = window.location.pathname;
	var buildID = url.substr(url.lastIndexOf("/")+1);
	var requestURL = "../../buildData/" + buildID;
	request.open("GET", requestURL);
	request.responseType = "json";
	request.send();
	var nextButton = document.getElementById("next");
	var prevButton = document.getElementById("previous");
	nextButton.addEventListener("click", function(){
		stepIndex++;
		layerIndex++;
		if(stepIndex == buildData.layers.length-1){
			this.disabled = true;
		}
		prevButton.disabled = false;
		changeLayerVisibility(true);
    });
	prevButton.addEventListener("click", function(){
		nextButton.disabled = false;
		layerIndex--;
		changeLayerVisibility(false);
		stepIndex--;
		if(stepIndex == 0){
			this.disabled = true;
		}
	});
};

function changeLayerVisibility(visible){
	
	var layers = document.getElementsByClassName("layer");
	console.log(layers.length);
	for(var i = 0; i < layers.length; i++){
		layers[i].style.display = "none";
		layers[layerIndex].style.display = "block";
	};
	
	for(var i = 0; i < cubes.children.length; i++){
		if(cubes.children[i].position.y == stepIndex*size){
			cubes.children[i].visible = visible;
		}
	}
	for(var i = 0; i < fencing.children.length; i++){
		if(fencing.children[i].position.y == stepIndex*size){
			fencing.children[i].visible = visible;
		}
	}
};

request.onload = function(){
	buildData = request.response;
	layerData = createLayerData(buildData);
	generateLayers();
	initialize();
	render();
}

function createLayerData(buildData){
	var layers = [];
	for(var i = 0; i < buildData.layers.length; i++){
		var layer = [];
		for(var j = 0; j < buildData.layers[i].length; j++){
			var containsTexture = {index:0, boolean:false};
			for(var z = 0; z < layer.length; z++){
				if(layer[z].texture.includes(buildData.layers[i][j].texture)){
					containsTexture.boolean = true;
					containsTexture.index = z;
				}
			}
			if(containsTexture.boolean){
				layer[containsTexture.index].amount+=1;
			}else{
				layer.push({texture: buildData.layers[i][j].texture, amount: 1})
			}
		}
		layers.push(layer);
	}
	return layers;
};

function generateLayers(){
	var element = document.getElementById("generateLayers");
	for(var i = 0; i < layerData.length; i++){
		var generatedLayer = document.createElement("div");
		generatedLayer.classList.add("layer");
		if(i > 0){
			generatedLayer.style.display = "none";
		}
		for(var j = 0; j < layerData[i].length; j++){
			var texture = document.createElement("button");
			var texturePicture = document.createElement("img");
			texture.disabled = true;
			texturePicture.class = "texture-picture";
			texturePicture.src = "../images/big/" 
				+ layerData[i][j].texture.substr(layerData[i][j].texture.lastIndexOf("/")+1);
			var textureAmount = document.createElement("h2");
			textureAmount.innerHTML = layerData[i][j].amount;
			generatedLayer.appendChild(texture);
			texture.appendChild(texturePicture);
			texture.appendChild(textureAmount);
		}
		element.appendChild(generatedLayer);
	}
};

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
	slabGeo = new THREE.BoxGeometry(size, size/2, size);
	doorGeo = createDoorGeometry();
	paneGeo = new THREE.BoxGeometry(size, size, size/8);
	fenceGeo = new THREE.BoxGeometry(size/3.5, size, size/3.5);
	fencingGeo = createFencingGeometry();
	stairGeo = createStairGeometry();
	cornerGeo = createCornerGeometry();

    window.addEventListener("resize", onWindowResize, false);
    document.addEventListener("mousemove", onmousemove, false);
    document.addEventListener("keydown", onDocumentKeyDown, false);
    document.addEventListener("mousedown", onDocumentMouseDown, false);

    scene.add(cubes);
	scene.add(fencing);
    createBuild();
};

function createFencingGeometry(){
	var fencingGeometry = new THREE.Geometry();
	var fencingPiece = new THREE.BoxGeometry(size/6.5, size/5.5, size);
	var fencingMesh1 = new THREE.Mesh(fencingPiece);
	var fencingMesh2 = new THREE.Mesh(fencingPiece);
	fencingMesh1.position.y = 5;
	fencingMesh1.updateMatrix();
	fencingMesh2.updateMatrix();
	fencingGeometry.merge(fencingMesh1.geometry, fencingMesh1.matrix);
	fencingGeometry.merge(fencingMesh2.geometry, fencingMesh2.matrix);
	return fencingGeometry;
}

function createStairGeometry(){
	var stairGeometry = new THREE.Geometry();	
	var newMeshPt1 = new THREE.Mesh(slabGeo);
	newMeshPt1.position.y = -size/4;
	var newMeshPt2 = new THREE.Mesh(slabGeo);
	newMeshPt2.rotation.x = Math.PI / 2;
	newMeshPt2.position.z = -size/4;
	newMeshPt1.updateMatrix();
	stairGeometry.merge(newMeshPt1.geometry, newMeshPt1.matrix);
	newMeshPt2.updateMatrix();
	stairGeometry.merge(newMeshPt2.geometry, newMeshPt2.matrix);
	return stairGeometry;
}

function createCornerGeometry(){
	var cornerGeometry = new THREE.Geometry();
	var stairMesh1 = new THREE.Mesh(createStairGeometry());
	var stairMesh2 = new THREE.Mesh(createStairGeometry());
	stairMesh2.rotation.z -= Math.PI / 2;
	stairMesh2.updateMatrix();
	cornerGeometry.merge(stairMesh1.geometry, stairMesh1.matrix);
	cornerGeometry.merge(stairMesh2.geometry, stairMesh2.matrix);
	return cornerGeometry;
}

function createDoorGeometry(){
	var doorGeo = new THREE.BoxGeometry(size, size*2, size/5);
	var doorGeometry = new THREE.Geometry();
	var doorMesh = new THREE.Mesh(doorGeo);
	doorMesh.position.y += size/2;
	doorMesh.position.z -= size/2.5;
	doorMesh.updateMatrix();
	doorGeometry.merge(doorMesh.geometry, doorMesh.matrix);
	return doorGeometry;
	
}

function createBuild(){
	for(var j = 0; j < buildData.layers.length; j++){
		for(var i = 0; i < buildData.layers[j].length; i++){
			var x = buildData.layers[j][i].x;
			var y = buildData.layers[j][i].y;
			var z = buildData.layers[j][i].z;
			var rotateDefault = buildData.layers[j][i].rotationAmount === "";
			var rotationAmount = rotateDefault? 0:buildData.layers[j][i].rotationAmount+1;
		//	var rotationAmount = buildData.layers[j][i].rotationAmount+1;
			var rotation = rotationAmount * (-Math.PI/2);
			var texture = "../" + buildData.layers[j][i].texture;
			cubes.add(getNewMesh(x, y, z, rotation, texture));
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

function getNewMesh(x, y, z, rotation, texture){
	var material = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture(texture)});
	material.transparent = true;
	var newFencing;
	var currentGeometry;
	if(texture.includes("corner")){
		currentGeometry = cornerGeo;
	}else if(texture.includes("stairs")){
		currentGeometry = stairGeo;
	}else if(texture.includes("door")){
		currentGeometry = doorGeo;
	}else if(texture.includes("pane")){
		currentGeometry = paneGeo;
	}else if(texture.includes("fence")){
		currentGeometry = fenceGeo;
		for(var i = 1; i < cubes.children.length; i++){
			var sameYPosition = y == cubes.children[i].position.y;
			var sameXPosition = x == cubes.children[i].position.x;
			var sameZPosition = z == cubes.children[i].position.z;
			if(sameYPosition && (sameXPosition || sameZPosition)){
				var xDifference = x - cubes.children[i].position.x;
				var closeXPosition = Math.abs(xDifference) == size;
				var zDifference = z - cubes.children[i].position.z;
				var closeZPosition = Math.abs(zDifference) == size;
				if(closeXPosition ? !closeZPosition : closeZPosition){
					newFencing = new THREE.Mesh(fencingGeo, material);
					var fencePostPosition = {x:x,y:y,z:z};
					var fencingLoc = findFencingPosition(fencePostPosition, cubes.children[i].position);
					newFencing.position.set(fencingLoc.x, fencingLoc.y, fencingLoc.z);
					newFencing.rotateY(closeZPosition ? 0 : Math.PI / 2);
					newFencing.updateMatrix();
					fencing.add(newFencing);
					newFencing.visible = false;
				}
			}
		}
	}else{
		currentGeometry = geometry;
	}
    var newMesh = new THREE.Mesh(currentGeometry, material);
    newMesh.position.set(x, y, z);
	newMesh.rotation.set(0, rotation, 0);
	if(y>0){
		newMesh.visible = false;
	}
    return newMesh;
};

function findFencingPosition(fencePosition, otherPosition){
	var fencingPosition = {x: 0,y: 0,z: 0};
	fencingPosition.x = (fencePosition.x+otherPosition.x)/2;
	fencingPosition.y = fencePosition.y;
	fencingPosition.z = (fencePosition.z+otherPosition.z)/2;
	return fencingPosition;
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
			fencing.position.x -= (x * Math.cos(theta) - z * Math.sin(theta)) - camera.position.x;
            fencing.position.z -= (z * Math.cos(theta) + x * Math.sin(theta)) - camera.position.z;
        }else if(keyCode == 39 || keyCode == 68) {
            cubes.position.x -= (x * Math.cos(theta) + z * Math.sin(theta)) - camera.position.x;
            cubes.position.z -= (z * Math.cos(theta) - x * Math.sin(theta)) - camera.position.z;
			fencing.position.x -= (x * Math.cos(theta) + z * Math.sin(theta)) - camera.position.x;
            fencing.position.z -= (z * Math.cos(theta) - x * Math.sin(theta)) - camera.position.z;
        }else if(keyCode == 38 || keyCode == 87) {
            cubes.position.y -= (y * Math.cos(theta*2) + (y * Math.sin(theta*2)/2)) - camera.position.y;
			fencing.position.y -= (y * Math.cos(theta*2) + (y * Math.sin(theta*2)/2)) - camera.position.y;
        }else if(keyCode == 40 || keyCode == 83) {
            cubes.position.y -= (y * Math.cos(theta*2) - (y * Math.sin(theta*2)/2)) - camera.position.y;
			fencing.position.y -= (y * Math.cos(theta*2) - (y * Math.sin(theta*2)/2)) - camera.position.y;
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
