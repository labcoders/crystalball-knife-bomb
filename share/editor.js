
var Program; // Parse.com class model
var emojiDB; // Emoji mapping to images
var ckEditor;


$(document).ready(function() {
	if (location.hash != "")
		loadProgram();
	window.addEventListener("hashchange", loadProgram);

	ckEditor = $("#source").ckeditor({
		uiColor: '#9AB8F3',
		customConfig: ''
	});

	Parse.initialize("rRc5MWWI4vyZEeshbvZFA1Nz4jKP6UCrgILPXQG3", "yPXq3zWBjYJpoOFsZWDisXYXdKxv6fblQdIMw5Nn");
	Program = Parse.Object.extend("Program");

	$.getJSON("emoji.json", function(data) {
		emojiDB = data;
	});
});

var charToIMG = function(c) {
	
}

var loadProgram = function() {
	console.log("loading a program!", location.hash.substring(1));
	var query = new Parse.Query(Program);
	query.get(location.hash.substring(1), {
		success: function(program) {
			$("#source").html(program.get("source"));
		},
		error: function(program, error) {
			console.error(error);
			alert("Error, the load failed. More info in console.");
		}
	});
}

var save = function() {
	var program = new Program();

	program.save({
		source: $("#source").html(),
		active: true
	}, {
		success: function(program) {
			location.hash = program.id;
		},
		error: function(program, error) {
			console.error(error);
			alert("Error, the save failed. More info in console.");
		}
	});
}

var toImage = function() {
	$("#source").html(emojione.unicodeToImage($("#source").html()));
}

var toUnicode = function() {
	$("#source img").replaceWith(function(){return $(this).attr("alt")});
	/*$("#source img").each(function() {
		var unicode = $(this).attr("alt");
		$(this).replaceWith(unicode);
	});*/
}