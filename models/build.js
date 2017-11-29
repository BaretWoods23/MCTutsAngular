var mongoose = require("mongoose"), Schema = mongoose.Schema;
mongoose.connect("mongodb://Admin:Nu140859348@ds119436.mlab.com:19436/mctutorials");

var BuildSchema = mongoose.Schema({
	build_name: String,
	build_user: String,
	build_width: String,
	build_length: String,
	screenshot: Object,
	layers: [],
});

var BlockSchema = mongoose.Schema({
	x: String,
	y: String,
	z: String,
	rotationAmount: String,
	texture: String,
});

var LayerSchema = mongoose.Schema({
	layers:[],
})

var Build = module.exports = mongoose.model("Build", BuildSchema);
var Block = module.exports = mongoose.model("Block", BlockSchema);
var Layer = module.exports = mongoose.model("Layer", LayerSchema);

module.exports.createBuild = function(newBuild, callback){
	var build = new Build();
	build.build_name = newBuild.build_name;
	build.build_user = newBuild.build_user;
	build.build_width = newBuild.build_width;
	build.build_length = newBuild.build_length;
	build.screenshot = newBuild.screenshot;
	for(var i = 0; i < newBuild.layers.length; i++){
		var layer = [];
		for(var j = 0; j < newBuild.layers[i].length; j++){
			var block = {x:0, y:0, z:0, rotationAmount:0, texture:""};
			block.x = newBuild.layers[i][j].x;
			block.y = newBuild.layers[i][j].y;
			block.z = newBuild.layers[i][j].z;
			block.rotationAmount = newBuild.layers[i][j].rotationAmount;
			block.texture = newBuild.layers[i][j].texture;
			layer.push(block);
		}
		build.layers.push(layer);
	}
	build.save(callback);
};

module.exports.createLayer = function(newLayer, callback){
	var layer = new Layer();
	for(var j = 0; j < newLayer.length; j++){
		var block = {x:0, y:0, z:0, rotationAmount:0, texture:""};
		block.x = newLayer[j].x;
		block.y = newLayer[j].y;
		block.z = newLayer[j].z;
		block.rotationAmount = newLayer[j].rotationAmount;
		block.texture = newLayer[j].texture;
		layer.layers.push(block);
	}
	layer.save(callback);
};

module.exports.createBlock = function(newBlock, callback){
	var block = new Block();
	block.x = newBlock.x;
	block.y = newBlock.y;
	block.z = newBlock.z;
	block.rotationAmount = newBlock.rotationAmount;
	block.texture = newBlock.texture;
	block.save(callback);
};

module.exports.getBuildById = function(id, callback){
	Build.findById(id, callback);
};

module.exports.returnAllBuilds = function(callback){
	Build.find(callback);
};

module.exports.deleteById = function(id, callback){
	Build.remove({_id: id}, callback);
};