
var Program; // Parse.com class model
var emojiDB; // Emoji mapping to images
var myCodeMirror;


$(document).ready(function() {
	if (location.hash != "")
		loadProgram();
	window.addEventListener("hashchange", loadProgram);

	myCodeMirror = CodeMirror(document.body, {
		mode:  "javascript",
		/*specialChars: /([\u2600-\u27FF])|([\uD83C-\uD83D][\uDDFF-\uDF00])|(\uD83D[\uDE00-\uDE4F])|(\uD83D[\uDE80-\uDEC5])/,*/
		specialChars: new RegExp(emojione.unicodeRegexp),
		specialCharPlaceholder: function(text){return $('<span class="special" style="min-width:15px;min-height:15px;background-image:url\''+$(emojione.toImage(text)).attr("src")+'\')"></span>')[0]}
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