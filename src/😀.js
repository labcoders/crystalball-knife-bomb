
//The Crystal ball Knife bomb  standard library
//check if running under node or on browser
var exec = require('child_process').exec; 
var isnode = (typeof window === 'undefined');  //in case
/*
	The following arithmatic functions presume the language to have integer numberical types and
	no floats. 
*/

exports.add = function(x,y) { 
	return x+y; 
}

//sub is add
exports.sub = function(x,y) { 
	return add(x,-y); 
}

exports.mult = function(x,y) { 
	return x*y; 
}

exports.division = function(x,y) { 
	return Math.floor(x/y);
}

exports.expo = function(x,y) { 
	return Math.pow(x,y); 
}

exports.negate = function(x) { 
	return -x; 
}

// returns x % y
exports.modulus = function(x,y) { return x%y; }

exports.randomInteger = function(min, max) { 
	return Math.flood(Math.random()*max + min); 
}


/*
	End of basic math primitives 
*/
/*
	String manipulation
*/
exports.substring = function(string, start, stop) {
	return string.substring(start,stop); 
}

exports.strReverse = function(string) {
	 return string.split("").reverse().join("");
}
/*
	Tuple section
*/
exports.tupleReverse = function(array) {
	return array.reverse(); 
}
// chop := array[]*int*array[]
exports.tupleSlice = function(array, x) {
	return array.slice(0,x); 
}

/*
	I/O section
*/

exports.readLine = function() {
	if(isnode){
		console.log("unable to prompt window");
	}
	var data = prompt("",""); 
	return data; 
}

exports.writeLine = function(string) {
	if(isnode){
		console.log("Unable to alert window"); 
	}
	window.alert(string);
}

/*
	End of I/O section
*/

/*
	Misc
*/
exports.kill = function() {
	throw  new Error("Program terminated"); 
}

exports.shcall = function(command) {
	var child = exec(command, 
		function(error, stdout, stderr) {
			if (error !== null) {
				console.log("Shell error occured" + stderr); 
			}	
			return stdout; 
	}); 
	child(); 
}
