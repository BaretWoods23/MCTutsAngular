var app = angular.module("myApp", []);

var request = new XMLHttpRequest();
var buildData;

app.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('((');
  $interpolateProvider.endSymbol('))');
});

app.service("buildsService", function($http){
    path = "../buildData";
    this.getData = function(){
        return $http.get(path)
        .then(function(response){
            this.builds = response.data;
            buildData = response.data;
            // for(var i = 0; i < this.builds.length; i++){
            //     var blob = URL.createObjectURL(this.builds[i].screenshot);
            //     this.builds[i].screenshot = blob;
            // }
            return this.builds;
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
    var screenshots = document.getElementsByClassName("screenshot");
    for(var i = 0; i < screenshots.length; i++){
        screenshots[i].src = URL.createObjectURL(buildData[i].screenshot);
        console.log(screenshots[i].src);
    }
};

var modal = document.getElementById("preferences-modal");

if(document.body.contains(modal)){
    var btn = document.getElementById("create"),
        span = document.getElementsByClassName("close")[0];
    btn.addEventListener("click", function(){
        modal.style.display = "block";
    });
    span.addEventListener("click", function(){
        modal.style.display = "none";
    });
    window.addEventListener("click", function(){
        if(event.target == modal){
            modal.style.display = "none";
        }
    });
};

function submitPreferences(){
	
}


