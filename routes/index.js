var express = require("express");
var router = express.Router();
var fs = require("fs");

var Build = require("../models/build");

router.get("/", function(req, res){
	res.render("index");
});

router.get("/buildData", function(req, res){
	Build.returnAllBuilds(function(err, build){
		if(err) throw err;
		else res.json(build);
	});
});

router.get("/buildData/:buildID", function(req, res){
	Build.getBuildById(req.params.buildID, function(err, build){
		if(err) throw err;
		else res.json(build);
	});
});

router.get("/delete/:buildID", function(req,res){
	Build.deleteById(req.params.buildID, function(err){
		if(err) throw err;
		res.render("delete");
	});
});

router.get("/tutorial/:buildID", function(req,res){
	res.render("tutorial");
});

router.get("/editer/:buildID", function(req,res){
	res.render("editer");
});

router.get("/profile/:username", function(req,res){
	var username = req.params.username;
	res.render("profile", {
		helpers: {
			if_equal: function(a, opts) {
				if (a == username) {
					return opts.fn(this)
				} else {
					return opts.inverse(this)
				}
        	}
		}
	});
});

router.get("/builder", ensureAuthenticated, function(req, res){
	res.render("builder");
});

router.post("/index", function(req, res){
	var jsonBuild = req.body;
	delete jsonBuild.layers;
	delete jsonBuild.screenshot;
	Build.createBuild(jsonBuild, function(err, build){
		if(err) throw err;
	});
});


router.post("/edited/:buildID", function(req, res){
	var jsonBuild = req.body;
	Build.createBuild(jsonBuild, function(err, build){
		if(err) throw err;
	});
	Build.deleteById(req.params.buildID, function(err){
		if(err) throw err;
	});
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