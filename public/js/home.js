var app = angular.module("myApp", []);

var request = new XMLHttpRequest();
var buildData;

app.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
});

app.service("buildsService", function($http){
    path = "../json/builds.json";
    this.getData = function(){
        return $http.get(path)
        .then(function(response){
            this.builds = response.data;
            return this.builds.builds;
        });
    };
});

app.controller("buildsCtrl", function($scope, buildsService) {  
    buildsService.getData()
    .then(function(builds){
        $scope.builds = builds;
		var url = window.location.pathname;
		var username = url.substr(url.lastIndexOf("/")+1);
		$scope.username = username;
    })
});

window.onload = function(){
	loadData();
};

function loadData() {
    request.open("GET", "../json/builds.json");
    request.onload = loadComplete;
    request.send();
};
 
function loadComplete(evt) {
    buildData = JSON.parse(request.responseText); 
};

//
//function returnUsersBuilds(){
//	var url = window.location.pathname;
//	var username = url.substr(url.lastIndexOf("/")+1);
//	return username + "'s builds: ";
//};



