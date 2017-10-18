var app = angular.module("myApp", []);

var request = new XMLHttpRequest();
var buildData;

app.service("buildsService", function($http){
    path = "/builds.json";
    this.getData = function(){
        return $http.get(path)
        .then(function(response){
            this.builds = response.data;
			console.log(this.builds.build_name);
            return this.builds;
        });
    };
});

app.controller("buildsCtrl", function($scope, buildsService) {  
    buildsService.getData()
    .then(function(builds){
        $scope.builds = builds;
    })
});

window.onload = function(){
	loadData();
};

function loadData() {
    request.open("GET", "builds.json");
    request.onload = loadComplete;
    request.send();
};
 
function loadComplete(evt) {
    buildData = JSON.parse(request.responseText); 
};

