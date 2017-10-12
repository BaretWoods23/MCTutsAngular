var app = angular.module('myApp', []);

var renderer, camera, scene, cube, geometry, material, controls;
var size = 16;
var cubes = new THREE.Object3D();
var boardWidth = 25;
var boardLength = 25;
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

app.service("blockService", function($http){
    path = "http://localhost:8080/blocks.json";
    this.getData = function(){
        return $http.get(path)
        .then(function(response){
            this.blocks = response.data;
            return this.blocks;
        });
    };
});

app.controller('blocksCtrl', function($scope, blockService) {  
    blockService.getData()
    .then(function(blocks){
        $scope.blocks = blocks.blocks;
    })
});

initialize();
render();

function initialize(){
    renderer = new THREE.WebGLRenderer({canvas: document.getElementById('myCanvas'), antialias: true});
    renderer.setClearColor(0x9FD6D9);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvWidth, canvHeight);

    camera = new THREE.PerspectiveCamera(35, canvWidth / canvHeight, 0.1, 5000);
    camera.position.set(800,500,500);
    camera.zoom += 1;
    camera.updateProjectionMatrix();

    controls = new THREE.TrackballControls(camera);
    controls.addEventListener('change', render);

    scene = new THREE.Scene();

    var light1 = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(light1);
    var light2 = new THREE.DirectionalLight(0xffffff);
    light2.position.set(0, 2, 1).normalize;
    scene.add(light2);

    geometry = new THREE.BoxGeometry(size, size, size);
	
	currentMaterial = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture(defaultTexture)});

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', onmousemove, false);
    document.addEventListener("keydown", onDocumentKeyDown, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);
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
    for(var i = length-1; i >= 0; i--){
            var cube = cubes.children[i];
            var x = cube.position.x;
            var y = cube.position.y;
            var z = cube.position.z;
            var intersects = raycaster.intersectObject(cube);
            if(intersects.length > 0){
                if(event.button == 2){
                    cubes.remove(cube);
                    break;
                }else if(event.button == 0){
                    var index = Math.floor(intersects[0].faceIndex/2);
                    if(index==0 && !spaceIsOccupied(x+size, y, z) && inBounds(x+size, z)){
                        cubes.add(getNewMesh(x+size, y, z, false));
                        break;
                    }else if(index==1 && !spaceIsOccupied(x-size, y, z) && inBounds(x-size, z)){
                        cubes.add(getNewMesh(x-size, y, z, false));
                        break;
                    }else if(index==2 && !spaceIsOccupied(x, y+size, z) && inBounds(x, z)){
                        cubes.add(getNewMesh(x, y+size, z, false));
                        break;
                    }else if(index==4 && !spaceIsOccupied(x, y, z+size) && inBounds(x, z+size)){
                        cubes.add(getNewMesh(x, y, z+size, false));
                        break;
                    }else if(index==5 && !spaceIsOccupied(x, y, z-size) && inBounds(x, z-size)){
                        cubes.add(getNewMesh(x, y, z-size, false));
                        break;
                    }
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

function onmousemove(event){
    var vector = new THREE.Vector3(((event.clientX)/canvWidth) * 2 - 1, - (event.clientY/canvHeight) * 2 + 1, 0.5);
    vector.unproject(camera);
    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    var length = cubes.children.length;
    cursorX = event.clientX;
    cursorY = event.clientY;
    for(var i = length-1; i >= 0; i--){
        var cube = cubes.children[i];
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
                break;
            }else if(index==1 && !spaceIsOccupied(x-size, y, z)){
                transparentCube.position.x = x-size;
                transparentCube.position.y = y;
                transparentCube.position.z = z;
                break;
            }else if(index==2 && !spaceIsOccupied(x, y+size, z)){
                transparentCube.position.x = x;
                transparentCube.position.y = y+size;
                transparentCube.position.z = z;
                break;
            }else if(index==4 && !spaceIsOccupied(x, y, z+size)){
                transparentCube.position.x = x;
                transparentCube.position.y = y;
                transparentCube.position.z = z+size;
                break;
            }else if(index==5 && !spaceIsOccupied(x, y, z-size)){
                transparentCube.position.x = x;
                transparentCube.position.y = y;
                transparentCube.position.z = z-size;
                break;
            }
        }else{
            transparentCube.material.opacity = 0;
        }
    }
};

function spaceIsOccupied(x, y, z){
    for(var i = 1; i < cubes.children.length; i++){
        var sameXValues = x == cubes.children[i].position.x;
        var sameYValues = y == cubes.children[i].position.y;
        var sameZValues = z == cubes.children[i].position.z;
        if(sameXValues && sameYValues && sameZValues){
            return true;
        }
    }
    return false;
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
    return newMesh;
};

function onDocumentKeyDown(event){
    if(!rotationActivated){
        var keyCode = event.which;
        var theta = .03; //.785
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
			if(this.childNodes[1].id.length > 0){
                removeSelector();
                this.classList.add("shiny");
				currentTexture = String(this.childNodes[1].id);
				var texture = currentTexture.replace("/big", "");
				currentMaterial = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture(texture)});
			}
        });
    };
	var palette = document.getElementsByClassName("palette-icon");
	for(var i = 0; i < palette.length; i++){
		palette[i].addEventListener("contextmenu", function(){
			this.childNodes[1].removeAttribute("id");
			this.childNodes[1].src = "/images/big/transparent.png";
			this.childNodes[1].removeAttribute("title");
		});
		palette[i].addEventListener("click", function(){
			if(this.id.length > 0){
				currentTexture = String(this.childNodes[1].id);
				var texture = currentTexture.replace("/big", "");
				currentMaterial = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture(texture)});
			}else{
				this.childNodes[1].id = currentTexture;
				this.childNodes[1].src = currentTexture;
				this.childNodes[1].title = currentTexture;
			}
		});
	};
};

