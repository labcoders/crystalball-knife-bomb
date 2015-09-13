var myApp = angular.module("myApp", []);

Parse.initialize("rRc5MWWI4vyZEeshbvZFA1Nz4jKP6UCrgILPXQG3", "yPXq3zWBjYJpoOFsZWDisXYXdKxv6fblQdIMw5Nn");

var Program = Parse.Object.extend("Program");

myApp.controller('emojiController', function($scope) {
	$scope.source = "";

	$scope.init = function() {
		$(document).ready(function() {
			if (location.hash != "")
				$scope.loadProgram();
			window.addEventListener("hashchange", $scope.loadProgram);
		});

	}

	$scope.loadProgram = function() {
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

	$scope.save = function() {
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

    $scope.toImage = function() {
		$("#source").html(emojione.unicodeToImage($("#source").html()));
	}

	$scope.toUnicode = function() {
		$("#source img").replaceWith(function(){return $(this).attr("alt")});
		/*$("#source img").each(function() {
			var unicode = $(this).attr("alt");
			$(this).replaceWith(unicode);
		});*/
	}

	$scope.init();
});