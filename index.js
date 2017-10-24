var express = require("express"),
	pug = require("pug"),
    bodyParser = require("body-parser"),
    path = require("path"),
	fs = require("fs");

var app = express();

app.set("view engine", "pug");
app.set("views",__dirname + "/views");
app.use(express.static(path.join(__dirname + "/public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", function(req, res){
    res.render("index");
});

app.get("/tutorial/:buildID", function(req,res){
	res.render("tutorial");
});

app.get("/:viewname", function(req, res){
	res.render(req.params.viewname);
});

app.post("/", function(req, res) {
	fs.readFile('public/builds.json', 'utf8', function (err, data) {
		if (err){
			return console.log(err);
		}
		var data = JSON.parse(data);
		var jsonBuild = req.body;
		data.builds.push(jsonBuild);
		var stringifiedData = JSON.stringify(data);
		console.log(stringifiedData);
		fs.writeFile("public/builds.json", stringifiedData, function(err, stringifiedData){
			if(err){
				return console.log(err);
			}
		});
	});
});

app.listen(8080);





