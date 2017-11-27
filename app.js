var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var expressHandlebars = require("express-handlebars");
var expressValidator = require("express-validator");
var flash = require("connect-flash");
var session = require("express-session");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var mongo = require("mongodb");
var mongoose = require("mongoose");
mongoose.connect("mongodb://Admin:Nu140859348@ds119436.mlab.com:19436/mctutorials");
var db = mongoose.connection;

var routes = require("./routes/index");
var users = require("./routes/users");
var builds = require("./routes/builds");

var app = express();
app.set("views", path.join(__dirname, "views"));
var handlebars = expressHandlebars.create({
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
app.engine(".handlebars", expressHandlebars({defaultLayout:"layout"},{extname: ".handlebars"}));
app.set("view engine", ".handlebars");

app.use(bodyParser.json({limit: "1000mb"}));
app.use(bodyParser.urlencoded({extended:false}));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "/public")));

app.use(session({
	secret: "secret",
	saveUnititialized: true,
	resave: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(expressValidator({
	errorFormatter: function(param, msg, value){
		var namespace = param.split(".")
		, root = namespace.shift()
		, formParam = root;
	while(namespace.length){
		formParam += "[" + namespace.shift() + "]";
	}
	return{
		param: formParam,
		msg: msg,
		value: value
	};
	}
}));

app.use(flash());

app.use(function(req,res,next){
	res.locals.success_msg = req.flash("success_msg");
	res.locals.error_msg = req.flash("error_msg");
	res.locals.error = req.flash("error");
	res.locals.user = req.user || null;
	next();
});

app.use("/", routes);
app.use("/users", users);
app.use("/builds", builds);

app.set("port", (process.env.PORT || 3000));

app.listen(app.get("port"), function(){
	console.log("Server started on port " + app.get("port"));
});