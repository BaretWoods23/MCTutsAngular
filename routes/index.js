var express = require("express");
var router = express.Router();
var fs = require("fs");

router.get("/", function(req, res){
	res.render("index");
});

router.get("/index", function(req, res){
	res.render("index");
});

router.get("/tutorial/:buildID", function(req,res){
	res.render("tutorial");
});

router.get("/profile/:username", function(req,res){
	res.render("profile");
});

router.get("/builder", ensureAuthenticated, function(req, res){
	res.render("builder");
});

//router.get("/:viewname", function(req, res){
//	res.render(req.params.viewname);
//});

router.post("/", function(req, res){
	fs.readFile('public/json/builds.json', 'utf8', function (err, data) {
		if (err){
			return console.log(err);
		}
		var data = JSON.parse(data);
		var jsonBuild = req.body;
		data.builds.push(jsonBuild);
		var stringifiedData = JSON.stringify(data);
		console.log(stringifiedData);
		fs.writeFile("public/json/builds.json", stringifiedData, function(err, stringifiedData){
			if(err){
				return console.log(err);
			}
		});
	});
});

router.post("/builder", function(req, res, next){
	console.log("BLOOP");
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}else{
		req.flash("error_msg", "You are not logged in.");
		res.redirect("/users/login");
	}
};

module.exports = router;