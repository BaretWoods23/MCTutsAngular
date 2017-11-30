var app = angular.module("myApp", []);

var renderer, camera, scene, cube, material, controls;
var geometry, slabGeo, stairGeo, doorGeo, paneGeo, fenceGeo, fencingGeo, cornerGeo;
var size = 16;
var cubes = new THREE.Object3D();
var fencing = new THREE.Object3D();
var cubeOpacity = 0.5;
var canvWidth = 1000;
var canvHeight = 600;
var rotationActivated = false;
var cursorX = 500;
var cursorY = 500;
var rotatingRight = false;
var currentMaterial;
var currentTexture = "../images/big/grass_top.png";
var defaultTexture = "../images/grass_top.png";
var locked = false;
var heightOffset = 155;
var widthOffset = 340;
var boardWidth, boardLength;
var imgsrc = "";

app.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
});

app.service("blockService", function($http){
    path = "../json/blocks.json";
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
	var url = window.location.href;
	var params = url.split("&");
	boardWidth = params[0].substr(params[0].indexOf("=")+1);
	boardLength = params[1].substr(params[1].indexOf("=")+1);
	baseBlock = params[2].substr(params[2].indexOf("=")+1);
	defaultTexture = "../images/" + baseBlock + ".png"
	
    renderer = new THREE.WebGLRenderer({canvas: document.getElementById("myCanvas"), antialias: true, preserveDrawingBuffer : true});
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
	
	currentMaterial = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture(defaultTexture)});

    window.addEventListener("resize", onWindowResize, false);
    document.addEventListener("mousemove", onmousemove, false);
    document.addEventListener("keydown", onDocumentKeyDown, false);
    document.addEventListener("mousedown", onDocumentMouseDown, false);
    var transparentCube = getNewMesh(0,0,0);
    cubes.add(transparentCube);
    scene.add(cubes);
	scene.add(fencing);
    createBoard();
	
	var canvas = document.getElementById("myCanvas");
	widthOffset = canvas.offsetLeft;
	heightOffset = canvas.offsetTop;
}

function createBoard(){
    for(var i = -boardWidth/2; i < boardWidth/2; i++){
        for(var j = -boardLength/2; j < boardLength/2; j++){
            cubes.add(getNewMesh(size*i, 0, size*j));
        }
    }
}

function render(){
    requestAnimationFrame(render);
    renderer.render(scene,camera);
}

function onDocumentMouseDown(event) {
    var vector = new THREE.Vector3(((event.clientX-widthOffset)/canvWidth) * 2 - 1
		, - ((event.clientY-heightOffset)/canvHeight) * 2 + 1, 0.5);
    vector.unproject(camera);
    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    var length = cubes.children.length;
    if(event.button == 1){
        rotationActivated = true;
        if(cursorX-widthOffset > canvWidth/2){
            rotatingRight = true;
        }else if(cursorX-widthOffset < canvWidth/2){
            rotatingRight = false;
        }
    }else if(cursorX < canvWidth + widthOffset && cursorY < canvHeight + heightOffset && cursorY > heightOffset && !locked){
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
				var loopNum = fencing.children.length-1;
				while(loopNum >= 0){
					var sameYPosition = fencing.children[loopNum].position.y == cube.position.y;
					var sameXPosition = fencing.children[loopNum].position.x == cube.position.x;
					var sameZPosition = fencing.children[loopNum].position.z == cube.position.z;
					if(sameYPosition && (sameXPosition || sameZPosition)){
						var xDifference = cube.position.x - fencing.children[loopNum].position.x;
						var closeXPosition = Math.abs(xDifference) == size/2;
						var zDifference = cube.position.z - fencing.children[loopNum].position.z;
						var closeZPosition = Math.abs(zDifference) == size/2;
						if(closeXPosition ? !closeZPosition : closeZPosition){
							fencing.remove(fencing.children[loopNum]);
						}
					}
					loopNum--;
				}
				cubes.remove(cube);
			}else if(event.button == 0){
				var transparentCube = cubes.children[0];
				var x = transparentCube.position.x;
				var y = transparentCube.position.y;
				var z = transparentCube.position.z;
				if(inBounds(x, z) && unblocked(x,y,z)){
					var newCube = cubes.children[0].clone();
					newCube.material = newCube.material.clone();
					newCube.material.opacity = 1;
					if(newCube.material.map.image.currentSrc.includes("fence")){
						for(var i = 1; i < cubes.children.length; i++){
							var sameYPosition = newCube.position.y == cubes.children[i].position.y;
							var sameXPosition = newCube.position.x == cubes.children[i].position.x;
							var sameZPosition = newCube.position.z == cubes.children[i].position.z;
							if(sameYPosition && (sameXPosition || sameZPosition)){
								var xDifference = newCube.position.x - cubes.children[i].position.x;
								var closeXPosition = Math.abs(xDifference) == size;
								var zDifference = newCube.position.z - cubes.children[i].position.z;
								var closeZPosition = Math.abs(zDifference) == size;
								if(closeXPosition ? !closeZPosition : closeZPosition){
									var newFencing = new THREE.Mesh(fencingGeo, newCube.material);
									var fencingLoc = findFencingPosition(newCube.position, cubes.children[i].position);
									newFencing.position.set(fencingLoc.x, fencingLoc.y, fencingLoc.z);
									newFencing.rotateY(closeZPosition ? 0 : Math.PI / 2);
									newFencing.updateMatrix();
									fencing.add(newFencing);
								}
							}
						}
					}
					cubes.add(newCube);
				}
			}
		}
	}
};

function unblocked(x, y, z){
	var unblocked = true;
	for(var i = 1; i < cubes.children.length; i++){
		var sameX = cubes.children[i].position.x == x;
		var sameY = cubes.children[i].position.y == y;
		var sameZ = cubes.children[i].position.z == z;
		if(sameX && sameY && sameZ){
			unblocked = false;
		}
	}
	return unblocked;
}

function findFencingPosition(fencePosition, otherPosition){
	var fencingPosition = {x: 0,y: 0,z: 0};
	fencingPosition.x = (fencePosition.x+otherPosition.x)/2;
	fencingPosition.y = fencePosition.y;
	fencingPosition.z = (fencePosition.z+otherPosition.z)/2;
	return fencingPosition;
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
    var vector = new THREE.Vector3(((event.clientX-widthOffset)/canvWidth) * 2 - 1
		, - ((event.clientY-heightOffset)/canvHeight) * 2 + 1, 0.5);
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
		transparentCube.material.transparent = true;
		transparentCube.material.opacity = 0.5;
		if(intersects.length > 0){
			var face = intersects[0].face.clone();
			transparentCube.position.x = x + (size*face.normal.x);
			transparentCube.position.y = y + (size*face.normal.y);
			transparentCube.position.z = z + (size*face.normal.z);
		}
	}
};

function onWindowResize() {
    camera.aspect = canvWidth / canvHeight;
    camera.updateProjectionMatrix();
	var canvas = document.getElementById("myCanvas");
	widthOffset = canvas.offsetLeft;
	heightOffset = canvas.offsetTop;
    renderer.setSize(canvWidth, canvHeight);
};

function getNewMesh(x, y, z){
	var newMesh;
	var material = currentMaterial.clone();
	newMesh = new THREE.Mesh(geometry, material);
    newMesh.position.set(x, y, z);
    return newMesh;
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

function onDocumentKeyDown(event){
    if(!rotationActivated && !locked){
        var keyCode = event.which;
        var theta = .03;
        var zoom = 0.5;
        var x = camera.position.x;
        var z = camera.position.z;
        var y = camera.position.y;
        if (keyCode == 65) {
            cubes.position.x -= (x * Math.cos(theta) - z * Math.sin(theta)) - camera.position.x;
            cubes.position.z -= (z * Math.cos(theta) + x * Math.sin(theta)) - camera.position.z;
			fencing.position.x -= (x * Math.cos(theta) - z * Math.sin(theta)) - camera.position.x;
            fencing.position.z -= (z * Math.cos(theta) + x * Math.sin(theta)) - camera.position.z;
        }else if(keyCode == 68) {
            cubes.position.x -= (x * Math.cos(theta) + z * Math.sin(theta)) - camera.position.x;
            cubes.position.z -= (z * Math.cos(theta) - x * Math.sin(theta)) - camera.position.z;
			fencing.position.x -= (x * Math.cos(theta) + z * Math.sin(theta)) - camera.position.x;
            fencing.position.z -= (z * Math.cos(theta) - x * Math.sin(theta)) - camera.position.z;
        }else if(keyCode == 87) {
            cubes.position.y -= (y * Math.cos(theta*2) + (y * Math.sin(theta*2)/2)) - camera.position.y;
			fencing.position.y -= (y * Math.cos(theta*2) + (y * Math.sin(theta*2)/2)) - camera.position.y;
        }else if(keyCode == 83) {
            cubes.position.y -= (y * Math.cos(theta*2) - (y * Math.sin(theta*2)/2)) - camera.position.y;
			fencing.position.y -= (y * Math.cos(theta*2) - (y * Math.sin(theta*2)/2)) - camera.position.y;
		}else if(keyCode == 82){
			var oldMesh = cubes.children[0].clone();
			var position = cubes.children[0].position;
			oldMesh.rotateY(-Math.PI/2);
			oldMesh.position.set(0,0,0);
			oldMesh.updateMatrix();
			var newGeo = new THREE.Geometry();
			newGeo.merge(oldMesh.geometry, oldMesh.matrix);
			cubes.children[0].geometry = newGeo;
			var name = cubes.children[0].name;
			name = name === ""? 0 : parseInt(name)+1;
			cubes.children[0].name = name;
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

function changeTransparentCube(texture){
	currentMaterial = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture(texture)});
	if(currentTexture.includes("corner")){
		var cornerTexture = currentTexture.substr(0, currentTexture.lastIndexOf("_")) + ".png";
		currentMaterial = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture(cornerTexture)});
		cubes.children[0].geometry = cornerGeo;
	}else if(currentTexture.includes("stairs")){
		cubes.children[0].geometry = stairGeo;
	}else if(currentTexture.includes("door")){
		cubes.children[0].geometry = doorGeo;
	}else if(currentTexture.includes("pane")){
		cubes.children[0].geometry = paneGeo;
	}else if(currentTexture.includes("fence")){
		cubes.children[0].geometry = fenceGeo;
	}else{
		cubes.children[0].geometry = geometry;
	}
	cubes.children[0].material = currentMaterial;
	cubes.children[0].name = "";
}

function itemIsClicked(item){
 	removeSelector();
	item.classList.add("shiny");
	currentTexture = String(item.childNodes[1].id);
	var texture = currentTexture.replace("/big", "");
	changeTransparentCube(texture);
}

window.onload = function(){
    // var icons = document.getElementsByClassName("texture");
    // for(var i = 0; i < icons.length; i++){
    //     icons[i].addEventListener("click", function(){
	// 		if(this.childNodes[1].id.length > 0){
    //             removeSelector();
    //             this.classList.add("shiny");
	// 			currentTexture = String(this.childNodes[1].id);
	// 			var texture = currentTexture.replace("/big", "");
	// 			changeTransparentCube(texture);
	// 		}
    //     });
    // };
	var palette = document.getElementsByClassName("palette-icon");
	for(var i = 0; i < palette.length; i++){
		palette[i].addEventListener("contextmenu", function(){
			this.childNodes[1].removeAttribute("id");
			this.childNodes[1].src = "../images/big/transparent.png";
			this.childNodes[1].removeAttribute("title");
		});
		palette[i].addEventListener("click", function(){
			if(this.id.length > 0){
				currentTexture = String(this.childNodes[1].id);
				var texture = currentTexture.replace("/big", "");
				changeTransparentCube();
			}else{
				this.childNodes[1].id = currentTexture;
				this.childNodes[1].src = currentTexture;
				this.childNodes[1].title = currentTexture;
			}
		});
	};
};

// function submit(){
// 	locked = true;
// 	controls.enabled = false;
// 	var newCanvas = document.getElementById("screenshot-canvas");
// 	var newContext = newCanvas.getContext("2d");
// 	newCanvas.height = canvHeight/8;
// 	newCanvas.width = canvWidth/8;
// 	newContext.drawImage(renderer.domElement,0,0,canvWidth,canvHeight,0,0,canvWidth/8,canvHeight/8);
// 	imgsrc = newCanvas.toDataURL("image/jpeg", 0.3);
// 	var img = document.getElementById("screenshot")
// 	img.src = imgsrc;
// 	console.log(imgsrc);
// }

function submit(){
	locked = true;
	controls.enabled = false;
	imgsrc = renderer.domElement.toDataURL();
	//imgsrc = "../images/big/grass_top.png";
	var img = document.getElementById("screenshot")
	img.src = imgsrc;
}

function upload(){
	writeToJSONFile();
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
	var jsonObject = getLayeredJSONObject();
	var jsonString = JSON.stringify(jsonObject);
	console.log(jsonString);
	var j = 0;
	for(var i = 0; i < jsonString.length; i++){
		if(i%30==0){
			var xhr = new XMLHttpRequest();
			xhr.withCredentials = true;
			xhr.open("POST", "/index");
			//xhr.setRequestHeader("content-type", "application/json;charset=UTF-8");
			xhr.setRequestHeader("content-type", "text/plain");
			console.log("TESTING");
			console.log(jsonString.substring(i-30,i));
			xhr.send(jsonString.substring(i-30,i));
			j = i;
		}
	}
	var xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	xhr.open("POST", "/index");
	xhr.setRequestHeader("content-type", "text/plain");
	console.log("TESTING");
	console.log(jsonString.substring(j));
	xhr.send(jsonString.substring(j));

};

function getLayeredJSONObject(){
	var buildName = document.getElementById("buildName").value;
	var buildUser = document.getElementById("buildUser").value;
	var cubeArray = getSortedCubeArray();
	var finishedObject = {
		"build_name": buildName,
		"build_user": buildUser,
		"build_width": boardWidth,
		"build_length": boardLength,
		"screenshot": imgsrc,
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
			"rotationAmount" : cubeArray[i].name,
			"texture" : texture
		});
	};
	return finishedObject;
}

var modal = document.getElementById("submit-modal");

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
		//	controls.enabled = true;
		//	locked = false;
            modal.style.display = "none";
        }
    });
};
