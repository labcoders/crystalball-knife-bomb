
var Program; // Parse.com class model
var emojiDB; // Emoji mapping to images
var emojiByCategory;
var ckEditor;
var jqxTheme = 'metrodark';

$(document).ready(function() {
	if (location.hash != "")
		loadProgram();
	window.addEventListener("hashchange", loadProgram);

	$('#mainSplitter').jqxSplitter(
		{theme: jqxTheme,
		width: '100%',
		height: '100%',
		orientation: 'vertical',
		panels: [{ size: 300, collapsible: true},{collapsible: false}]
	});
    $('#leftSplitter').jqxSplitter(
    	{theme: jqxTheme,
    	width: '100%',
    	height: '100%',
    	orientation: 'horizontal',
    	panels: [{ size: '30%'}]
    });
    $('#rightSplitter').jqxSplitter(
    	{theme: jqxTheme,
    	width: '100%',
    	height: '100%',
    	orientation: 'horizontal',
    	panels: [{ size: '60%'}]
    });

	Parse.initialize("rRc5MWWI4vyZEeshbvZFA1Nz4jKP6UCrgILPXQG3", "yPXq3zWBjYJpoOFsZWDisXYXdKxv6fblQdIMw5Nn");
	Program = Parse.Object.extend("Program");

	$.getJSON("emoji.json", function(data) {
		emojiDB = data;
		emojiByCategory = _.groupBy(emojiDB, 'category');

		var emojiTree = _.mapObject(emojiByCategory, function(emojis,category){
			return {
				label: category,
				items: _.map(emojis, function(emoji) {
					return {
						icon: emoji2URL(emoji),
						label: emoji.name
					}
				})
			}
		});
		$('#constructs').jqxTree({ source: emojiTree, theme: jqxTheme, width: '100%', height: '100%'});

		$('#all-emoji').jqxTabs({
			width: '100%',
			height: '100%',
			theme: jqxTheme,
			animationType: 'fade',
			selectionTracker: true
		});

		for (var categoryName in emojiByCategory) {
			$('#all-emoji').jqxTabs('addLast', categoryName, 'Loading...');
		}

		$('#all-emoji').jqxTabs('initTabContent', function(tab){
			if (emojiByCategory[$('#all-emoji').jqxTabs('getTitleAt', tab)]) {
				//alert("yo "+tab);
				var content = "";
				//console.log($('#all-emoji').jqxTabs('getTitleAt', tab));
				emojiByCategory[$('#all-emoji').jqxTabs('getTitleAt', tab)].forEach(function(emoji) {
					content += emoji2img(emoji);
				});
				$('#all-emoji').jqxTabs('setContentAt', tab, content);
			}
		});
	});

	$("#search").on("input", searchEmojis);
});

function emoji2URL(emoji) {
	return 'http://cdn.jsdelivr.net/emojione/assets/png/'+emoji.unicode+'.png?v=1.2.4';
}

function emoji2img(emoji) {
	//console.log(emoji.unicode, Number('0x'+emoji.unicode))
	return '<img src="'+emoji2URL(emoji)+'" class="emojione" />';//alt="'+String.fromCodePoint(Number('0x'+emoji.unicode))+'" />';
	//return emojione.toImage(emoji.shortname)
}

function searchEmojis() {
	var minChars = 3;
	var search = $("#search").val();
	var content = "";
	if (search.length >= minChars) {
		var searchTerms = search.split(" ");
		var results = _.filter(emojiDB, function(emoji) {
			var keywords = emoji.name.split(" ").concat(emoji.keywords);
			return (_.intersection(searchTerms, keywords).length >= 1);
		});
		results.forEach(function(emoji) {
			content += emoji2img(emoji);
		});
	} else {
		content = "Please enter at least "+minChars+" characters.";
	}
	$('#search-results').html(content);
}

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