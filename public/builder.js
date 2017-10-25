var app = angular.module("myApp", []);

var renderer, camera, scene, cube, geometry, material, controls;
var size = 16;
var cubes = new THREE.Object3D();
var boardWidth = 15;
var boardLength = 15;
var cubeOpacity = 0.5;
var canvWidth = 1000;
var canvHeight = 800;
var rotationActivated = false;
var cursorX = 500;
var cursorY = 500;
var rotatingRight = false;
var currentMaterial;
var currentTexture = "images/big/grass_top.png";
var defaultTexture = "images/grass_top.png";
var locked = false;

app.service("blockService", function($http){
    path = "/blocks.json";
    this.getData = function(){
        return $http.get(path)
        .then(function(response){
            this.blocks = response.data;
            return this.blocks;
        });
    };
});

app.controller("blocksCtrl", function($scope, blockService) {  
    blockService.getData()
    .then(function(blocks){
        $scope.blocks = blocks.blocks;
    })
});

initialize();
render();

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
	
	currentMaterial = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture(defaultTexture)});

    window.addEventListener("resize", onWindowResize, false);
    document.addEventListener("mousemove", onmousemove, false);
    document.addEventListener("keydown", onDocumentKeyDown, false);
    document.addEventListener("mousedown", onDocumentMouseDown, false);
    var transparentCube = getNewMesh(0,0,0, true);
    transparentCube.material.color.setHex(0xAAAAFF);
    transparentCube.material.transparent = true;
    transparentCube.material.opacity = cubeOpacity;
    cubes.add(transparentCube);
    scene.add(cubes);
    createBoard();
}

function createBoard(){
    for(var i = -boardWidth/2; i < boardWidth/2; i++){
        for(var j = -boardLength/2; j < boardLength/2; j++){
            cubes.add(getNewMesh(size*i, 0, size*j, false));
        }
    }
}

function render(){
    requestAnimationFrame(render);
    renderer.render(scene,camera);
}

function onDocumentMouseDown(event) {
    var vector = new THREE.Vector3(((event.clientX)/canvWidth) * 2 - 1, - (event.clientY/canvHeight) * 2 + 1, 0.5);
    vector.unproject(camera);
    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    var length = cubes.children.length;
    if(event.button == 1){
        rotationActivated = true;
        if(cursorX > canvWidth/2){
            rotatingRight = true;
        }else if(cursorX < canvWidth/2){
            rotatingRight = false;
        }
    }else if(cursorX < canvWidth && cursorY < canvHeight){
		cubes.add(getNewMesh(x, y, z, false));
		var cubeArray = [];
		var intersects;
		for(var i = length-1; i >= 1; i--){
			var cubeCur = cubes.children[i];
			var intersectsCur = raycaster.intersectObject(cubeCur);
			if(intersectsCur.length > 0){
				var cubeDistance = intersectsCur[0].distance;
				cubeArray.push([cubeCur, cubeDistance]);
				intersects = intersectsCur;
			}
		}
		cubeArray.sort(function(a, b){
			return a[1] - b[1];
		});
		if(cubeArray.length > 0){
			var cube = cubeArray[0][0];
			if(event.button == 2){
				cubes.remove(cube);
			}else if(event.button == 0){
				var transparentCube = cubes.children[0];
				var x = transparentCube.position.x;
				var y = transparentCube.position.y;
				var z = transparentCube.position.z;
				if(inBounds(x, z)){
					cubes.add(getNewMesh(x, y, z, false));
				}
			}
		}
	}
};

function inBounds(x, z){
    var isInBounds = true;
    var xDistance = boardWidth/2*size;
    var zDistance = boardLength/2*size;
    if(x < -xDistance || x >= xDistance){
        isInBounds = false;
    }
    if(z < -zDistance || z >= zDistance){
        isInBounds = false;
    }
    return isInBounds;
};

function onmousemove(event) {
    var vector = new THREE.Vector3(((event.clientX)/canvWidth) * 2 - 1, - (event.clientY/canvHeight) * 2 + 1, 0.5);
    vector.unproject(camera);
    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    var length = cubes.children.length;
	var cubeArray = [];
	var intersects;
	cursorX = event.clientX;
    cursorY = event.clientY;
	for(var i = length-1; i >= 1; i--){
		var cubeCur = cubes.children[i];
		var intersectsCur = raycaster.intersectObject(cubeCur);
		if(intersectsCur.length > 0){
			var cubeDistance = intersectsCur[0].distance;
			cubeArray.push([cubeCur, cubeDistance]);
			intersects = intersectsCur;
		}
	}
	cubeArray.sort(function(a, b){
		return a[1] - b[1];
	});
	if(cubeArray.length > 0){
		var cube = cubeArray[0][0];
		var transparentCube = cubes.children[0];
		var x = cube.position.x;
		var y = cube.position.y;
		var z = cube.position.z;
		var intersects = raycaster.intersectObject(cube);
		if(intersects.length > 0){
			var index = Math.floor(intersects[0].faceIndex/2);
			transparentCube.material.opacity = cubeOpacity;
			if(index==0 && !spaceIsOccupied(x+size, y, z)){
				transparentCube.position.x = x+size;
				transparentCube.position.y = y;
				transparentCube.position.z = z;
			}else if(index==1 && !spaceIsOccupied(x-size, y, z)){
				transparentCube.position.x = x-size;
				transparentCube.position.y = y;
				transparentCube.position.z = z;
			}else if(index==2 && !spaceIsOccupied(x, y+size, z)){
				transparentCube.position.x = x;
				transparentCube.position.y = y+size;
				transparentCube.position.z = z;
			}else if(index==4 && !spaceIsOccupied(x, y, z+size)){
				transparentCube.position.x = x;
				transparentCube.position.y = y;
				transparentCube.position.z = z+size;
			}else if(index==5 && !spaceIsOccupied(x, y, z-size)){
				transparentCube.position.x = x;
				transparentCube.position.y = y;
				transparentCube.position.z = z-size;
			}
		}else{
			transparentCube.material.opacity = 0;
		}
	}
};

function spaceIsOccupied(x, y, z){
	var occupied = false;
    for(var i = 1; i < cubes.children.length; i++){
        var sameXValues = x == cubes.children[i].position.x;
        var sameYValues = y == cubes.children[i].position.y;
        var sameZValues = z == cubes.children[i].position.z;
        if(sameXValues && sameYValues && sameZValues){
            occupied = true;
        }
    }
    return occupied;
};

function onWindowResize() {
    camera.aspect = canvWidth / canvHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvWidth, canvHeight);
};

function getNewMesh(x, y, z, transparent){
	var material;
	if(transparent){
		material = new THREE.MeshPhongMaterial({color: 0xffffff, specular: 0x555555, shininess: 30});
	}else{
		material = currentMaterial;
	}
	material.shininess = 2;
    var newMesh = new THREE.Mesh(geometry, material);
    newMesh.position.set(x, y, z);
	newMesh.name = currentMaterial;
    return newMesh;
};

function onDocumentKeyDown(event){
    if(!rotationActivated && !locked){
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

function removeSelector(){
    var icons = document.getElementsByClassName("texture");
    for(var i = 0; i < icons.length; i++){
        icons[i].classList.remove("shiny");
    }
}

window.onload = function(){
    document.getElementById("grass_top").classList.add("shiny");
    var icons = document.getElementsByClassName("texture");
    for(var i = 0; i < icons.length; i++){
        icons[i].addEventListener("click", function(){
			if(this.childNodes[0].id.length > 0){
                removeSelector();
                this.classList.add("shiny");
				currentTexture = String(this.childNodes[0].id);
				var texture = currentTexture.replace("/big", "");
				currentMaterial = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture(texture)});
			}
        });
    };
	var palette = document.getElementsByClassName("palette-icon");
	for(var i = 0; i < palette.length; i++){
		palette[i].addEventListener("contextmenu", function(){
			this.childNodes[0].removeAttribute("id");
			this.childNodes[0].src = "images/big/transparent.png";
			this.childNodes[0].removeAttribute("title");
		});
		palette[i].addEventListener("click", function(){
			if(this.id.length > 0){
				currentTexture = String(this.childNodes[0].id);
				var texture = currentTexture.replace("/big", "");
				currentMaterial = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture(texture)});
			}else{
				this.childNodes[0].id = currentTexture;
				this.childNodes[0].src = currentTexture;
				this.childNodes[0].title = currentTexture;
			}
		});
	};
};

function submit(){
	locked = true;
	controls.enabled = false;
}

function upload(){
	writeToJSONFile();
	window.location = "../";
};

function getSortedCubeArray(){
	var cubeArray = [];
	for(var i = 1; i < cubes.children.length; i++){
		var y = cubes.children[i].position.y;
		if(y || y == 0){
			cubeArray.push(cubes.children[i])
		}
	};
	cubeArray.sort(function(a, b){
		return a.position.y - b.position.y;
	});
	return cubeArray;
};

function writeToJSONFile(){
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	xhr.open("POST", "/");
	xhr.setRequestHeader("content-type", "application/json;charset=UTF-8");
	var jsonObject = getLayeredJSONObject();
	xhr.send(JSON.stringify(jsonObject));
};

function getLayeredJSONObject(){
	var buildName = document.getElementById("buildName").value;
	var cubeArray = getSortedCubeArray();
	var finishedObject = {
		"build_name":buildName,
		"build_user":"Placeholder",
		"layers":[]
	};
	var currentLayer = 0;
	finishedObject.layers.push([]);
	for(var i = 0; i < cubeArray.length; i++){
		var texture = cubeArray[i].material.map.image.currentSrc;
		texture = texture.substring(texture.indexOf("/images/")+1);
		if(cubeArray[i].position.y != currentLayer*size){
			currentLayer++;
			finishedObject.layers.push([]);
		};
		finishedObject.layers[currentLayer].push({
			"x" : cubeArray[i].position.x,
			"y" : cubeArray[i].position.y,
			"z" : cubeArray[i].position.z,
			"texture" : texture
		});
	};
	return finishedObject;
}

var modal = document.getElementById("modal");

if(document.body.contains(modal)){
    var btn = document.getElementById("submit"),
        span = document.getElementsByClassName("close")[0];
    btn.addEventListener("click", function(){
        modal.style.display = "block";
    });
    span.addEventListener("click", function(){
        modal.style.display = "none";
		locked = false;
		controls.enabled = true;
    });
    window.addEventListener("click", function(){
        if(event.target == modal){
			controls.enabled = true;
			locked = false;
            modal.style.display = "none";
        }
    });
};
