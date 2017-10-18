var express = require("express"),
	pug = require("pug"),
    bodyParser = require("body-parser"),
    path = require("path"),
	fs = require("fs");

var app = express();

//var buildData = require("builds.json");

app.set("view engine", "pug");
app.set("views",__dirname + "/views");
app.use(express.static(path.join(__dirname + "/public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", function(req, res){
    res.render("index");
});

app.get("/:viewname", function(req, res){
    //res.render(req.params.viewname, buildData);
	res.render(req.params.viewname);
});

app.post("/", function(request, response) {
	var jsonContents = JSON.stringify(request.body);
	fs.writeFile("public/builds.json", jsonContents, function(err, jsonContent){
		if(err){
			return console.log(err);
		}
		console.log(jsonContents);
		});
});

app.listen(8080);





