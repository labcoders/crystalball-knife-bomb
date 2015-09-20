
var Program; // Parse.com class model
var emojiDB; // Emoji mapping to images
var emojiByCategory;
var ckEditor;
var jqxTheme = 'metrodark';
var compiled = null;

$(document).ready(function() { // Big  setup!
	Parse.initialize("rRc5MWWI4vyZEeshbvZFA1Nz4jKP6UCrgILPXQG3", "yPXq3zWBjYJpoOFsZWDisXYXdKxv6fblQdIMw5Nn");
	Program = Parse.Object.extend("Program");

	if (location.hash != "")
		loadProgram();
	window.addEventListener("hashchange", loadProgram);


	$('#menu').jqxMenu({
		theme: jqxTheme,
		width: '100%',
		height: '100%',
	});
	$('#menu').css('visibility', 'visible');
	$('#menu').jqxMenu("disable", "run", false);

	$('#menuSplitter').jqxSplitter({
		theme: jqxTheme,
		width: '100%',
		height: '100%',
		orientation: 'horizontal',
		panels: [{ size: '30px'}],
		showSplitBar: false,
		resizable: false
	});

	$('#mainSplitter').jqxSplitter({
		theme: jqxTheme,
		width: '100%',
		height: '100%',
		orientation: 'vertical',
		panels: [{ size: 500, collapsible: true},{collapsible: false}]
	});
    $('#leftSplitter').jqxSplitter({
    	theme: jqxTheme,
    	width: '100%',
    	height: '100%',
    	orientation: 'horizontal',
    	panels: [{ size: '30%', collapsible: false},{collapsible: true}]
    });
    $('#rightSplitter').jqxSplitter({
    	theme: jqxTheme,
    	width: '100%',
    	height: '100%',
    	orientation: 'horizontal',
    	panels: [{ size: '60%', collapsible: false}]
    });

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

		var replaceShortnames = function(item) {
			item.value = {};
			if (item.s) { // If it has a shortcut
				item.value.s = item.s;
				item.value.emoji = emojiDB[item.value.s]; // Link to that emoji
				item.icon = emoji2URL(item.value.emoji); // Add its icon
			}
			if (item.i)
				item.value.i = item.i;
			if (item.items) // Traverse the children
				item.items = _.map(item.items, replaceShortnames); // Save the modifications
			console.log(item);
			return item; // Return modified item
		}
		constructs = _.map(constructsIsh, replaceShortnames);
		$('#constructs').jqxTree({
			source: constructs,
			theme: jqxTheme,
			width: '100%',
			height: '100%'
		});
		$('#constructs').on("expand collapse", function(e) {
			//TODO update to make scrollbars work
		});
		$('#constructs').on('select',function (event) {
		    var args = event.args;
		    var item = $('#constructs').jqxTree('getItem', args.element);
		    console.log("Selected construct", item);
	    	if (item.value.i)
	    		addHtmlToSource(shortNamesToHtml(escapeHTML(item.value.i))); // Parse specified html
		    else if (item.value.s)
	    		addHtmlToSource(emoji2img(emojiDB[item.value.s])); // Just take its icon/shortcut
	    	$("#constructs").jqxTree('selectItem', null);
		});
		/*$('#constructs').jqxTree({ source: emojiTree, theme: jqxTheme, width: '100%', height: '100%'});*/

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
		$('#all-emoji').jqxTabs('val', 0);

		$('#all-emoji').jqxTabs('initTabContent', function(tab){
			if (emojiByCategory[$('#all-emoji').jqxTabs('getTitleAt', tab)]) {
				//alert("yo "+tab);
				var content = "";
				console.log("tab #"+tab, $('#all-emoji').jqxTabs('getTitleAt', tab), "loaded.");
				emojiByCategory[$('#all-emoji').jqxTabs('getTitleAt', tab)].forEach(function(emoji) {
					content += emoji2img(emoji);
				});
				$('#all-emoji').jqxTabs('setContentAt', tab, content);
			}
		});
		$("#all-emoji, #constructs").jqxPanel({
			theme:jqxTheme,
			width: '100%',
			height:'100%',
			autoUpdate: true,
			scrollBarSize: 12
		});
	});

	$("#search").jqxInput({
		theme: jqxTheme,
		placeHolder: "Search for an emoji",
		height: 30,
		width: '100%',
		minLength: 1,
		source: searchAutocomplete
	});
	$("#search").on("input select", searchEmojis); // input: value changed, select: autocomplete selected

	/*$('#source').jqxEditor({
		theme: jqxTheme,
		width: '100%',
		height: '100%',
		pasteMode: 'html',
		tools: 'bold italic underline | left center right' 
	});*/ // Ditched in favour of plain div[contentEditable=true] because there was no way to ('execute', 'insertHTML', emojiHTML)...

	$('#all-emoji').on('click', '[class*=emojione-]', function(e) {
		addHtmlToSource($(e.target).prop('outerHTML'));
		return false;
	});

	newProgram();
});

function emoji2URL(emoji) {
	return 'http://cdn.jsdelivr.net/emojione/assets/png/'+emoji.unicode+'.png?v=1.2.4';
}
function emoji2img(emoji) {
	//console.log(emoji.unicode, Number('0x'+emoji.unicode))
	//return '<img src="'+emoji2URL(emoji)+'" class="emojione" title="'+emoji.name+'"/>';//alt="'+String.fromCodePoint(Number('0x'+emoji.unicode))+'" />';
	//return emojione.toImage(emoji.shortname)+emoji.shortname.slice(1, emoji.shortname.length-2)
	var c = String.fromCodePoint(parseInt(emoji.unicode, 16));
	return '<input type="button" class="emojione-'+emoji.unicode+'" title="'+emoji.name+'" alt="'+c+'" />'
}
function stripShortname(shortname) {
	return shortname.slice(1, shortname.length-2);
}
function shortNamesToHtml(text) {
	return text.replace(/:([a-z0-9_]+):/gi, function(match, shortname){return emoji2img(emojiDB[shortname]);});
}
function escapeHTML(t) {
	return $('<div/>').text(t).html();
}

function addHtmlToSource(html) {
	console.log("Inserting", html, "to source");
	//$('#source').focus();
	document.getElementById('source').focus();
	pasteHtmlAtCaret(html, false);
}

function pasteHtmlAtCaret(html, selectPastedContent) {
    var sel, range;
    if (window.getSelection) {
        // IE9 and non-IE
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();

            // Range.createContextualFragment() would be useful here but is
            // only relatively recently standardized and is not supported in
            // some browsers (IE9, for one)
            var el = document.createElement("div");
            el.innerHTML = html;
            var frag = document.createDocumentFragment(), node, lastNode;
            while ( (node = el.firstChild) ) {
                lastNode = frag.appendChild(node);
            }
            var firstNode = frag.firstChild;
            range.insertNode(frag);
            
            // Preserve the selection
            if (lastNode) {
                range = range.cloneRange();
                range.setStartAfter(lastNode);
                if (selectPastedContent) {
                    range.setStartBefore(firstNode);
                } else {
                    range.collapse(true);
                }
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    } else if ( (sel = document.selection) && sel.type != "Control") {
        // IE < 9
        var originalRange = sel.createRange();
        originalRange.collapse(true);
        sel.createRange().pasteHTML(html);
        if (selectPastedContent) {
            range = sel.createRange();
            range.setEndPoint("StartToStart", originalRange);
            range.select();
        }
    }
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
		if (results.length > 0) {
			results.forEach(function(emoji) {
				content += emoji2img(emoji);
			});
		} else
			content = "No results, sorry.";
	} else {
		content = "Please enter at least "+minChars+" characters.";
	}
	$('#search-results').html(content);
}

function getUnicodeSource() {
	var content = $('#source').clone();
	content.find('[class*=emojione-]').replaceWith(function(){return $(this).attr("alt")});
	return content.text();
}
function toPairs(text) {
	return [].map.call(text, function(c){
		return /*prefix +*/ c.charCodeAt(0).toString(16).toUpperCase();
	});
}

function loadProgram() {
	console.log("loading a program!", location.hash.substring(1));
	var query = new Parse.Query(Program);
	query.get(location.hash.substring(1), {
		success: function(program) {
			/*var source = program.get("source").replace(emojione.unicodeRegexp, function(match) {
				_.map(match, match); //TODO
			})*/
			$("#source").html();
			//notify("success", "Program loaded.");
		},
		error: function(program, error) {
			console.error(error);
			notify("error", "The load failed. More info in console.");
		}
	});
}

function newProgram() {
	$('#source').html("").focus();
}

function compile() {
	var input = getUnicodeSource();
	console.log("input",input);

	var ast = parser.parse(input);
	console.log("AST", ast);

	output = codegen.traverse(ast);
	console.log("compiled", output);

	$('#menu').jqxMenu("disable", "run", true);
}

function run() {
	if (output != null)
		console.log(exec(output));
}

function share() {
	var program = new Program();

	program.save({
		source: getUnicodeSource(),
		active: true
	}, {
		success: function(program) {
			location.hash = program.id;
			notify("success", "Your program was saved. You can share the URL.");
		},
		error: function(program, error) {
			console.error(error);
			notify("error", "The save failed. More info in console.");
		}
	});
}

function notify(type, text) {
	$('<div>'+text+'</div>').jqxNotification({
		theme: jqxTheme,
		width: "auto",
		position: "bottom-right",
        opacity: 0.9,
        autoOpen: true,
        autoClose: true,
        template: type
    });
}

var constructs;
var constructsIsh = [
	{
		label: "Statements",
		items: [
			{
				label: "Import",
				s: "gift",
				i: ":gift: <ident>"
			}, {
				label: "Include",
				s: "syringe",
				i: ":syringe: <ident>"
			}
		]
	},{
		label: "Declarations",
		items: [
			{
				label: "Foreign Function Interface",
				s: "warning",
				i: ":warning: <local_ident> :v:<foreign_name>:v:"
			}, {
				label: "Function",
				s: "flag_black",
				i: ":flag_black: <ident> :arrow_right_hook: <pattern> :arrow_upper_left: <expr>",
				items: [
					{
						label: "Main",
						s: "four_leaf_clover"
					}
				]
			}
		]
	},{
		label: "Expressions",
		items: [
			{
				label: "Identifier",
				i: "<ident>"
			}, {
				label: "Parenthesised Expression",
				i: ":last_quarter_moon_with_face: <expr> :first_quarter_moon_with_face:"
			}, {
				label: "Function Application",
				i: "<ident> :straight_ruler: <ident>",
				items: [
					{
						label: "Left Parenthesis",
						s: "last_quarter_moon_with_face"
					},{
						label: "Separator",
						s: "straight_ruler"
					}, {
						label: "Right Parenthesis",
						s: "first_quarter_moon_with_face"
					}
				]
			}, {
				label: "Literals",
				items: [
				{
					label: "Boolean",
					i: "<:thumbsup:/:thumbsdown:>",
					items: [
						{
							label: "True",
							s: "thumbsup"
						}, {
							label: "False",
							s: "thumbsdown"
						}, 
					]
				},{
					label: "Integer",
					s: "hash",
					i: "<digits>!",
					items: [
						{
							label: "Zero",
							s: "zero"
						},{
							label: "One",
							s: "one"
						}, {
							label: "Two",
							s: "two"
						}, {
							label: "Three",
							s: "three"
						}, {
							label: "Four",
							s: "four"
						}, {
							label: "Five",
							s: "five"
						}, {
							label: "Six",
							s: "six"
						}, {
							label: "Seven",
							s: "seven"
						}, {
							label: "Eight",
							s: "eight"
						}, {
							label: "Nine",
							s: "nine"
						}, {
							label: "End of Number",
							s: "exclamation",
							i: "!"
						}
					]
				}, {
					label: "String",
					s: "v",
					i: ":v: <text> :v:"
				}, {
					label: "Tuple",
					s: "point_right",
					i: ":point_right: <pattern> <pattern :point_up:>* :point_left:",
					items: [
						{
							label: "Left Bracket",
							s: "point_right"
						}, {
							label: "Separator",
							s: "point_up"
						}, {
							label: "Right Bracket",
							s: "point_left"
						}
					]
				}, {
					label: "Object",
					s: "package"
				}, {
					label: "Lambda Function",
					s: "chart_with_upwards_trend",
					i: ":chart_with_upwards_trend: <patterns> :arrow_upper_left: <expr>",
					items: [
						{
							label: "Bind",
							s: "arrow_upper_left"
						}, {
							label: "Alternative",
							s: "arrow_right_hook"
						}
					]
				}, 
				]
			}
		]
	}, {
		label: "Patterns",
		items: [
			{
				label: "Wild",
				s: "snowflake"
			}, {
				label: "Identifier",
				i: "<ident>"
			}, {
				label: "Boolean",
				i: "<:thumbsup:/:thumbsdown:>"
			}, {
				label: "Integer",
				s: "hash",
				i: "<digits>!"
			}, {
				label: "String",
				s: "v",
				i: ":v: <text> :v:"
			}, {
				label: "Object",
				s: "package",
				i: ":package: <pattern> <pattern>?"
			}, {
				label: "Tuple",
				s: "point_right",
				i: ":point_right: <pattern> <pattern :point_up:>* :point_left:"
			}
		]
		
	}

];
var searchAutocomplete = ["hundred","points","symbol","numbers","score","percent","a","plus","perfect","school","quiz","test","exam","100","input","for","blue-square","grinning","face","happy","joy","smile","grin","smiling","smiley","with","eyes","tears","of","cry","haha","weep","open","mouth","and","funny","laugh","cold","sweat","hot","perspiration","tightly-closed","lol","laughing","halo","angel","innocent","ring","circle","heaven","horns","devil","impish","trouble","imp","angry","evil","cute","winking","mischievous","secret","wink","friendly","joke","crush","embarrassed","flushed","shy","white","blush","happiness","massage","relaxed","savouring","delicious","food","tongue","eat","yummy","yum","tasty","savory","relieved","satisfied","phew","relief","heart-shaped","affection","infatuation","like","valentines","heart","lovestruck","love","flirt","sunglasses","cool","sun","glasses","sunny","smooth","smirking","mean","prank","smug","smirk","half-smile","conceited","neutral","indifference","objective","impartial","blank","expressionless","void","vapid","without expression","indifferent","unamused","bored","serious","straight face","not amused","depressed","unhappy","disapprove","lame","sick","anxious","worried","clammy","diaphoresis","pensive","okay","sad","thoughtful","think","reflective","wistful","meditate","confused","daze","perplex","puzzle","skeptical","undecided","uneasy","hesitant","confounded","unwell","amaze","mystify","kissing","3","kiss","pucker","lips","smooch","throwing","blowing kiss","closed","passion","puckered","stuck-out","childish","playful","silly","cheeky","eye","kidding","crazy","ecstatic","disappointed","disappoint","frown","discouraged","upset","concern","distressed","nervous","tense","livid","mad","vexed","irritated","annoyed","frustrated","pouting","despise","hate","pout","anger","rage","irate","crying","tear","persevering","endure","persevere","no","look","triumph","gas","steam","breath","but","frowning","aw","sulk","glower","anguished","stunned","pain","anguish","ouch","misery","distress","grief","fearful","oops","scared","terrified","fear","frightened","weary","sleepy","tired","tiredness","study","finals","exhausted","rest","whine","grimacing","teeth","grimace","loudly","sob","melancholy","morn","somber","hurt","impressed","jaw","gapping","surprise","wow","hushed","woo","quiet","hush","whisper","silent","exasperated","screaming","in","munch","scream","painting","artist","alien","astonished","xox","shocked","flattered","flush","red","pink","cheeks","sleeping","sleep","snore","dizzy","drunk","inebriated","spent","unconscious","buzzed","without","hellokitty","medical","mask","ill","virus","flu","slightly","slight","cat","animal","cats","wry","confident","confidence","miffed","footprints","feet","bust","silhouette","human","man","person","user","member","account","guest","icon","avatar","profile","me","myself","i","busts","group","team","people","members","accounts","relationship","shadow","business","suit","levitating","hover","exclamation","sleuth","or","spy","pi","undercover","investigator","baby","child","infant","toddler","boy","male","kid","girl","female","classy","dad","father","guy","mustache","woman","lady","family","mom","mother","parents","unit","(man,woman,girl)","(man,woman,girl,boy)","children","(man,woman,boy,boy)","(man,woman,girl,girl)","(woman,woman,boy)","gay","lesbian","homosexual","(woman,woman,girl)","(woman,woman,girl,boy)","(woman,woman,boy,boy)","(woman,woman,girl,girl)","(man,man,boy)","(man,man,girl)","(man,man,girl,boy)","(man,man,boy,boy)","(man,man,girl,girl)","holding","hands","date","dating","marriage","two","men","bromance","couple","friends","unity","women","girlfriends","sisters","daughter","bunny","ears","girls","dancing","dancers","showgirl","playboy","costume","cancan","bride","veil","wedding","planning","gown","dress","engagement","blond","hair","blonde","young","western","westerner","occidental","gua","mao","skullcap","chinese","asian","qing","turban","headdress","headwear","pagri","india","indian","mummy","wisdom","peace","older","grandma","grandmother","police","officer","arrest","enforcement","law","cop","construction","worker","wip","princess","crown","royal","royalty","king","queen","disney","high-maintenance","guardsman","british","gb","uk","guard","bearskin","hat","ceremonial","military","cupid","wings","jesus","christmas","festival","xmas","santa","saint nick","jolly","ho ho ho","north pole","presents","gifts","naughty","nice","sleigh","holiday","ghost","halloween","japanese","ogre","monster","oni","demon","troll","folklore","theater","goblin","tengu","supernatural","avian","nose","frustration","pile","poo","poop","shit","shitface","turd","skull","dead","skeleton","dying","death","extraterrestrial","UFO","paul","ufo","arcade","game","space","invader","bowing","deeply","sorry","bow","respect","bend","information","desk","help","question","answer","sassy","unimpressed","attitude","snarky","good","gesture","stop","nope","don&#039;t","not","ok","yes","accept","raising","one","hand","raise","notice","attention","sexy","dejected","rejected","haircut","(woman,woman)","(man,man)","both","celebration","hooray","winning","woot","yay","banzai","raised","clapping","sign","applause","congrats","praise","clap","appreciation","approval","sound","encouragement","enthusiasm","ear","hear","listen","peek","watch","stalk","smell","sniff","mark","taste","buds","tease","french kiss","lick","playfulness","silliness","intimacy","nail","polish","beauty","manicure","waving","farewell","goodbye","solong","hi","wave","thumbs","up","+1","down","-1","pointing","index","direction","finger","backhand","left","right","fingers","limbs","smoke","smoking","marijuana","joint","pot","420","victory","ohyeah","v","fisted","fist","punch","grasp","flexed","biceps","arm","flex","strong","muscle","bicep","butterfly","writing","write","signature","draw","turned","splayed","five","halt","reversed","fu","middle","extended","part","between","vulcan","spock","leonard","nimoy","star trek","live long","sideways","folded","highfive","hope","namaste","please","wish","pray","high five","sorrow","regret","seedling","grass","lawn","nature","plant","new","start","grow","evergreen","tree","needles","deciduous","leaves","fall","color","palm","coconuts","fronds","warm","tropical","cactus","vegetable","desert","drought","spike","poke","tulip","flower","bulb","spring","easter","cherry","blossom","rose","fragrant","thorns","petals","romance","hibiscus","sunflower","seeds","yellow","daisy","bouquet","flowers","rice","seed","herb","medicine","weed","spice","cook","cooking","four","leaf","clover","lucky","luck","irish","saint","patrick","green","maple","canada","syrup","fallen","autumn","fluttering","wind","float","mushroom","fungi","fungus","shroom","chestnut","squirrel","roasted","rat","mouse","rodent","crooked","snitch","mice","hamster","ox","beef","cow","bull","water","buffalo","asia","bovine","milk","dairy","bessie","moo","tiger","striped","tony","tigger","hobs","leopard","spot","spotted","chipmunk","rabbit","reproduction","prolific","meow","pet","kitten","horse","gamble","powerful","draft","calvary","cowboy","cowgirl","mounted","race","ride","gallop","trot","colt","filly","mare","stallion","gelding","yearling","thoroughbred","pony","ram","sheep","wool","flock","follower","ewe","lamb","goat","billy","livestock","rooster","chicken","cockerel","cock","cock-a-doodle-doo","crowing","cluck","hen","poultry","chick","bird","hatching","born","egg","front-facing","fly","tweet","penguin","elephant","thailand","dromedary","camel","hump","middle east","heat","hump day","wednesday","sex","bactrian","central asia","boar","pig","piggy","pork","ham","hog","bacon","oink","slop","greed","greedy","snout","truffle","dog","friend","puppy","woof","bark","fido","poodle","101","showy","sophisticated","vain","wolf","bear","grizzly","koala","panda","cub","endearment","friendship","bamboo","china","black","monkey","see-no-evil","see","vision","sight","mizaru","hear-no-evil","kikazaru","speak-no-evil","talk","say","words","verbal","verbalize","oral","iwazaru","primate","banana","dragon","myth","fire","legendary","head","crocodile","croc","alligator","gator","cranky","snake","turtle","slow","shell","tortoise","chelonian","reptile","snap","steady","frog","whale","ocean","sea","blubber","bloated","fat","large","massive","spouting","dolphin","fins","fish","flipper","octopus","creature","blowfish","pufferfish","puffer","ballonfish","toadfish","fugu fish","sushi","spiral","beach","sand","crab","nautilus","snail","escargot","french","appetizer","bug","insect","error","ant","honeybee","bee","buzz","pollen","sting","honey","hive","bumble","pollination","beetle","ladybug","ladybird","lady cow","spider","arachnid","eight-legged","web","cobweb","paw","prints","tracking","imprints","footsteps","lion","raccoon","critter","high","voltage","lightning bolt","thunder","weather","zap","flame","crescent","moon","night","waxing","sky","cheese","phase","rays","brightness","behind","cloud","partly","overcast","rain","wet","snow","lightning","tornado","destruction","funnel","droplet","drip","faucet","drop","h20","aqua","moisture","moist","spit","splashing","drops","umbrella","fog","damp","hazy","dash","air","fast","shoo","snowflake","season","winter","frozen","ice","crystal","chilly","unique","special","below zero","elsa","glowing","star","sparkle","glow","classic","medium","shooting","shoot","comet","meteoroid","sunrise","over","mountains","vacation","view","morning","rural","rainbow","unicorn","pride","diversity","spectrum","refract","leprechaun","gold","surf","tide","volcano","lava","magma","explode","milky","way","outer","galaxy","stars","planets","mount","fuji","japan","mountain","peak","nation","island","globe","meridians","earth","international","world","planet","europe-africa","africa","europe","americas","USA","north","south","asia-australia","east","australia","first","quarter","gibbous","full","spooky","werewolves","twilight","waning","last","anthropomorphic","bright","blowing","ribbon","bowtie","decoration","lace","wrap","decorate","wrapped","present","birthday","gift","package","cake","party","birth","dessert","celebrate","jack-o-lantern","pumpkin","carve","october","saints","horror","scary","december","ornaments","tanabata","pine","years","spirits","harvest","prosperity","longevity","fortune","welcome","farming","agriculture","viewing","ceremony","observing","otsukimi","tsukimi","scene","fireworks","carnival","congratulations","independence","explosion","july","4th","rocket","idea","excitement","firework","sparkler","shine","popper","tada","announcement","climax","confetti","ball","win","new years","balloon","helium","intoxicated","squeans","starburst","sparkles","shiny","collision","bomb","boom","bang","emphasis","bam","graduation","cap","college","degree","university","mortarboard","academic","education","tassel","kod","leader","reminder","awareness","medal","honor","acknowledgment","purple heart","heroism","veteran","dolls","kimono","toy","day","emperor","empress","blessing","imperial","carp","streamer","banner","koinobori","kids","boys","flags","chime","ding","bell","fūrin","instrument","music","soothing","protective","spiritual","crossed","izakaya","lantern","light","stay","drink","alcohol","bar","sake","restaurant","propose","diamond","heavy","intense","desire","broken","breakup","split","letter","email","envelope","hearts","emotion","revolving","lovers","beating","growing","sparkling","arrow","tip","on","the","purple-square","purple","violet","sensitive","understanding","compassionate","compassion","duty","sacrifice","trust","respectful","honest","caring","selfless","rebirth","reborn","jealous","clingy","envious","possessive","blue","stability","truth","loyalty","runner","exercise","run","jog","sprint","marathon","pedestrian","walk","stroll","stride","hiking","hike","dancer","fun","fancy","boogy","ballet","tango","cha cha","weight","lifter","bench","press","squats","deadlift","golfer","sport","par","birdie","eagle","mulligan","rowboat","hobby","ship","boat","row","oar","paddle","swimmer","swim","pool","laps","freestyle","breaststroke","backstroke","surfer","swell","bath","shower","tub","basin","wash","bubble","soak","bathroom","soap","clean","shampoo","lather","snowboarder","boarding","halfpipe","board","alpine","ski","boot","downhill","cross-country","poles","powder","slalom","snowman","bicyclist","bike","hipster","road","pedal","bicycle","transportation","racing","motorcycle","speed","car","formula 1","stock","nascar","drive","betting","competition","jockey","triple crown","tent","camp","outdoors","pup","fishing","pole","rod","reel","soccer","fifa","football","european","basketball","hoop","NBA","bball","dribble","net","swish","rip city","court","american","NFL","america","baseball","MLB","pitch","tennis","racquet","racket","rugby","sports","england","flag","hole","golf","trophy","award","contest","ftw","place","show","reward","achievement","running","shirt","sash","pageant","play","cloths","compete","chequered","finishline","gokart","checkered","finish","complete","end","musical","keyboard","piano","organ","electric","keys","guitar","string","jam","rock","acoustic","violin","fiddle","saxophone","sax","woodwind","trumpet","brass","note","tone","multiple","notes","melody","clef","treble","g-clef","stave","staff","headphone","gadgets","beats","audio","microphone","PA","mic","voice","karaoke","performing","arts","acting","drama","performance","entertainment","story","comedy","tragedy","masks","ticket","concert","event","pass","stub","admission","proof","purchase","top","gentleman","magic","beaver","tall","stove","pipe","chimney","topper","london","period piece","magician","circus","big","canvas","clapper","film","movie","record","clapboard","take","frames","8mm","16mm","celluloid","tickets","palette","design","paint","art","colors","brush","pastels","oils","acrylic","direct","hit","bullseye","dart","archery","fletching","billiards","eight ball","pocket ball","cue","bowling","bowl","pin","strike","spare","slot","machine","bet","vegas","one-armed bandit","slots","die","dice","craps","video","PS4","console","controller","nintendo","xbox","playstation","playing","cards","august","card","joker","poker","mahjong","tile","kanji","carousel","amusement","park","fair","ferris","wheel","londoneye","farris","roller","coaster","playground","tomato","fruit","sauce","italian","aubergine","eggplant","penis","maize","corn","iowa","kernel","popcorn","husk","cob","sweet","potato","potassium","starch","pepper","spicy","chili","cayenne","habanero","jalapeno","grapes","wine","vinegar","vine","melon","cantaloupe","honeydew","watermelon","summer","tangerine","citrus","orange","lemon","peel","bunch","pineapple","pina","apple","mac","electronics","doctor","teacher","core","pie","granny","smith","pear","shape","peach","juicy","pit","cherries","strawberry","shortcake","berry","hamburger","meat","burger","angus","slice","pizza","new york","italy","pepperoni","bone","cooked","mutton","leg","fried","cracker","seaweed","nori","grain","curry","flavor","meal","steaming","chopsticks","noodle","ramen","noodles","soup","spaghetti","bread","toast","wheat","loaf","yeast","fries","chips","fry","russet","idaho","dango","dumpling","mochi","balls","skewer","oden","seafood","casserole","stew","raw","nigiri","shrimp","small","swirl","kamboko","naruto","soft","cream","icecream","serve","cone","yogurt","shaved","treat","flavoring","waffle","doughnut","snack","donut","pastry","breakfast","homer","cookie","chocolate","oreo","biscuit","candy","coca","hershey&#039;s","sugar","hard","lollipop","stick","custard","rich","butter","crème","brûlée","bees","pooh","short","bento","box","obento","convenient","lunchbox","hearty","thick","pan","flat","frying","utensil","fork","knife","cutlery","kitchen","utensils","teacup","handle","tea","beverage","cafe","espresso","coffee","bottle","cup","ferment","glass","booze","fermented","tasting","winery","cocktail","mixed","martini","coconut","beer","mug","pub","relax","hops","barley","malt","portland","oregon","brewery","micro","pint","clinking","mugs","cheers","container","nipple","newborn","formula","accessories","time","gadget","mobile","phone","dial","technology","iphone","call","cell","rightwards","at","incoming","personal","computer","laptop","tech","desktop","cpu","old","terminal","wired","typing","device","button","trackball","three","networked","computers","lan","wan","network","printer","hardcopy","paper","inkjet","laser","window","pocket","calculator","add","subtract","divide","scientific","alarm","clock","wake","mantlepiece","hourglass","flowing","countdown","oldschool","camera","photo","picture","flash","camcorder","motion","projector","television","program","tv","jacks","midi","studio","recording","level","slider","controls","control","knobs","radio","communication","podcast","portable","stereo","pager","bbcall","joystick","games","atari","telephone","receiver","touchtone","clamshell","cellphone","fax","minidisc","data","disc","disk","floppy","save","storage","kilobyte","megabyte","tape","cartridge","gigabyte","hd","optical","dvd","cd","videocassette","battery","energy","power","sustain","plug","charger","electricity","torch","dark","flashlight","candle","wax","satellite","antenna","orbital","credit","bill","dollar","money","pay","payment","loan","shopping","mastercard","visa","american express","wallet","bills","spend","work","lost","blown","burned","cash","bag","coins","loot","gem","stone","ruby","precious","drizzle","protection","ultraviolet","uv","pouch","cosmetic","packing","makeup","purse","fashion","clutch","handbag","coin bag","accessory","ladies","briefcase","documents","satchel","student","backpack","pack","adventure","travel","sightsee","lipstick","eyeglasses","eyesight","spectacles","nearsightedness","myopia","farsightedness","hyperopia","blurry","contacts","shades","womans","sandal","shoes","high-heeled","shoe","boots","mans","athletic","sneaker","bikini","swimming","clothes","clothing","blouse","wardrobe","breasts","cleavage","shop","dressing","dressed","t-shirt","cloth","tee","necktie","formal","tie","jeans","pants","denim","levi&#039;s","levi","designer","skinny","door","entry","exit","house","doorway","entrance","enter","bathtub","toilet","restroom","wc","throne","porcelain","waste","plumbing","barber","salon","style","trim","syringe","blood","drugs","health","hospital","needle","pill","drug","prescription","microscope","experiment","laboratory","zoomin","telescope","future","reading","wrench","diy","ikea","tools","hocho","blade","dagger","nut","bolt","hammer","done","judge","ruling","verdict","oil","drum","petroleum","cigarette","kills","tobacco","cancer","lungs","inhale","tar","nicotine","crossbones","poison","danger","pistol","violence","weapon","gun","bookmark","favorite","newspaper","headline","rolled-up","thermometer","temperature","label","tag","key","lock","password","mail","postal","back","stamped","flying","pen","downwards","above","inbox","e-mail","tray","outbox","horn","postbox","mailbox","lowered","document","page","text","facing","curl","pages","tabs","wastebasket","trash","garbage","dispose","empty","stationery","post-it","pad","chart","upwards","trend","graph","presentation","stats","calendar","schedule","tear-off","ballot","vote","low","compression","reduce","frame","an","x","tiles","scroll","roll","parchment","history","papyrus","ancient","clipboard","book","library","literature","novel","notebook","decorative","cover","classroom","ledger","bookkeeping","accounting","finances","read","books","collection","series","rolodex","dividers","file","organization","link","rings","url","paperclip","linked","paperclips","pushpin","scissors","cut","triangular","ruler","architect","math","sketch","round","straight","post","triangle","flagpole","pennant","athletics","signal","well","folder","load","cabinet","folders","office","nib","pencil","lower","ballpoint","bic","ink","fountain","calligraphy","paintbrush","crayon","memo","station","security","privacy","unlock","cheering","megaphone","speaker","volume","public","address","loudspeaker","noise","waves","loud","cancellation","stroke","mute","bullhorn","snooze","notification","ringing","alert","beamed","ascending","descending","latin","cross","religion","celtic","om","hinduism","dharmic","buddhism","jainism","dove","thought","comic","day dream","wonder","speech","conversation","dialogue","bubbles","mood","feeling","crossing","caution","street","crosswalk","shield","interstate","route","highway","left-pointing","magnifying","search","zoom","detective","details","right-pointing","speaking","accommodation","hotel","motel","prohibited","denied","disallow","forbid","limit","bad","name","badge","pedestrians","rules","walking","do","litter","bin","bicycles","cyclist","non-potable","tap","undrinkable","dirty","gross","phones","under","eighteen","18","piracy","theft","rule","circled","ideograph","agree","advantage","get","bargain","grade","brilliance","intelligence","homework","assignment","congratulation","squared","cjk","unified","ideograph-5408","join","unite","agreement","ideograph-6e80","red-square","ideograph-7981","restricted","prohibit","restrict","ideograph-6709","own","possess","orange-square","ideograph-7121","none","lack","ideograph-7533","request","ideograph-55b6","ideograph-6708","month","ideograph-5272","sale","ideograph-7a7a","katakana","sa","koko","destination","here","ideograph-6307","green-square","point","yen","eight","spoked","asterisk","negative","deny","check","pointed","vibration","mode","off","vs","versus","capital","alphabet","type","b","ab","cl","clear","o","o2","sos","emergency","id","identification","p","cars","parking","closet","free","ng","no good","automated","teller","atm","withdrawal","deposit","financial","bank","adam","payday","aries","astrology","greek","constellation","zodiac","horoscope","taurus","gemini","twins","leo","virgo","maiden","libra","scales","scorpius","scorpion","scorpio","sagittarius","centaur","archer","capricorn","sea-goat","goat-horned","aquarius","bearer","pisces","unisex","mens","womens","crawl","diaper","babe","wheelchair","disabled","handicapped","potable","liquid","drinkable","pure","put","its","receptacle","can","forward","backward","up-pointing","down-pointing","double","rewind","next","leftwards","previous","upper","west","anticlockwise","arrows","sync","counterclockwise","hook","turn","then","curving","twisted","clockwise","loop","repeat","once","number","digit","zero","1","2","prime","4","six","6","seven","7","8","nine","9","keycap","ten","10","letters","source","bars","cinema","symbols","calculation","addition","minus","sub","wavy","line","division","multiplication","multiply","times","nike","go","cancel","delete","semicircle","trade","brand","trademark","copyright","ip","license","registered","currency","exchange","value","curly","scribble","alternation","sing","song","vocal","m","ornament","doubt","bangbang","punctuation","wat","interrobang","rounded","corners","warning","remove","abo","soon","cyclone","hurricane","typhoon","storm","blue-circle","ophiuchus","serpent","dot","beginner","current","trident","emblem","spear","poseidon","neptune","springs","rosette","universal","recycling","environment","inside","cuteness","kawaii","glyph","adorable","spade","club","bold","script","square","oclock","eleven","twelve","one-thirty","two-thirty","three-thirty","four-thirty","five-thirty","six-thirty","seven-thirty","eight-thirty","nine-thirty","ten-thirty","eleven-thirty","twelve-thirty","railway","vehicle","streetcar","trolley","coach","train","rail","transport","locomotive","engine","choo-choo","diesel","Tram","Car","transit","monorail","mono","high-speed","bullet","metro","mrt","tube","underground","subway","tram","track","bus","city","oncoming","trolleybus","bart","minibus","ambulance","911","assistance","fighter","truck","citation","crime","taxi","uber","automobile","service","cab","sedan","recreational","suv","wagon","delivery","articulated","lorry","semi","tractor","farm","equipment","motorway","freeway","traffic","fuel","pump","progress","vertical","yield","horizontal","launch","staffmode","spacecraft","astronaut","cosmonaut","helicopter","heli","gyro","gyrocopter","airplane","flight","plane","airport","airlines","jet","jumbo","boeing","airbus","northeast-pointing","departure","leaving","arriving","seat","sit","chair","anchor","ferry","harbor","marina","shipyard","sailor","tattoo","titanic","yacht","passenger","motorboat","speedboat","powerboat","sailboat","cutter","catboat","dinghy","ketch","schooner","sloop","yawl","aerial","tramway","cable","cableway","suspension","passport","customs","official","foreign","authority","government","border","goods","baggage","claim","luggage","suitcase","banknote","euro","pound","sterling","britain","united states","bellhop","porter","bed","twin","mattress","couch","lamp","lounge","sectional","sofa","loveseat","leather","microfiber","plate","lunch","dinner","setting","bags","mall","buy","store","statue","liberty","staten island","moyai","foggy","bridge","tokyo","tower","display","feature","decor","architecture","castle","building","residence","disneyland","fort","fortified","moat","prince","lord","fortress","nobel","stronghold","classical","iconic","genre","stadium","convention","capped","elevation","camping","wilderness","roughing","activity","relaxation","tanning","tan","dry","sandy","barren","land","solitude","alone","national","woods","wildlife","forest","cityscape","skyscraper","lights","buiildings","metropolis","sunset","buildings","scape","metropolitan","rise","dusk","evening","cloudless","san francisco","golden","home","dwelling","mansion","bungalow","ranch","craftsman","garden","yard","derelict","boarded","abandoned","vacant","run down","shoddy","site","bureau","department","retail","merchandise","factory","production","manufacturing","shipping","surgery","savings","accomodation","checkin","holiday inn","leisure","adultery","prostitution","no-tell","groom","union","church","christ","convenience","bodega","7-eleven","corner","elementary","teach","map","atlas","cartography","country","au","austria","&ouml;sterreich","osterreich","belgium","belgique","belgie","be","brazil","brasil","br","ca","chile","prc","zhong guo","cn","colombia","co","denmark","danmark","dk","finland","suomen tasavalta","fi","france","fr","germany","german","deutschland","de","hong","kong","xianggang","hk","bharat","indonesia","ireland","&eacute;ire","eire","ie","israel","yisra'el","yisrael","il","italia","it","nippon","jp","korea","south korea","kr","macau","aomen","mo","malaysia","my","mexico","mx","netherlands","nederland","holland","nl","zealand","aotearoa","nz","norway","norge","philippines","pilipinas","ph","poland","polska","pl","portugal","pt","puerto","rico","pr","russia","russian","ru","saudi","arabia","al arabiyah as suudiyah","singapore","sg","spain","espa&ntilde;a","espana","es","sweden","sverige","se","switzerland","swiss","turkey","turkiye","great","UK","britsh","united kingdom","united","states","usa","united states of america","old glory","us","arab","emirates","ae","vietnam","viet nam","vn","afghanistan","afghanestan","af","albania","shqiperia","al","algeria","al jaza'ir","al jazair","dz","andorra","ad","angola","ao","anguilla","ai","antigua","barbuda","ag","argentina","ar","armenia","hayastan","am","aruba","ascension","ac","azerbaijan","azarbaycan","az","bahamas","bs","bahrain","al bahrayn","bh","bangladesh","bd","barbados","bb","belarus","byelarus","by","belize","bz","benin","bj","bermuda","bm","bhutan","bt","bolivia","bo","bosnia","herzegovina","bosna i hercegovina","ba","botswana","bw","brunei","bn","bulgaria","bg","burkina","faso","bf","burundi","bi","cambodia","kampuchea","kh","cameroon","cm","cape","verde","cabo verde","cv","cayman","islands","ky","central","african","republic","cf","comoros","km","democratic","congo","r&eacute;publique d&eacute;mocratique du congo","republique democratique du congo","cg","chad","tchad","td","costa","rica","cr","cote","d'ivoire","ci","croatia","hrvatska","hr","cuba","cu","cyprus","kibris","kypros","cy","czech","ceska republika","cz","djibouti","dj","dominica","dm","dominican","timor","tl","ecuador","ec","egypt","misr","eg","el","salvador","sv","equatorial","guinea","guinea ecuatorial","gq","eritrea","hagere ertra","er","estonia","eesti vabariik","ee","ethiopia","ityop'iya","ityopiya","et","falkland","islas malvinas","fk","faroe","foroyar","fo","fiji","fj","polynesia","polyn&eacute;sie fran&ccedil;aise","polynesie francaise","pf","gabon","ga","gambia","gm","georgia","sak'art'velo","sakartvelo","ge","ghana","gh","gibraltar","gi","greece","ellas","ellada","gr","greenland","kalaallit nunaat","gl","grenada","gd","guam","gu","guatemala","gt","guinee","gn","guinea-bissau","guine-bissau","guine bissau","gw","guyana","gy","haiti","ht","honduras","hn","hungary","magyarorszag","hu","iceland","lyoveldio island","is","iran","ir","iraq","iq","jamaica","jm","jersey","je","jordan","al urdun","jo","kazakhstan","qazaqstan","kz","kenya","ke","kiribati","kiribas","ki","kosovo","xk","kuwait","al kuwayt","kw","kyrgyzstan","kyrgyz respublikasy","kg","laos","la","latvia","latvija","lv","lebanon","lubnan","lb","lesotho","ls","liberia","lr","libya","libiyah","ly","liechtenstein","li","lithuania","lietuva","lt","luxembourg","letzebuerg","lu","macedonia","mk","madagascar","mg","malawi","mw","maldives","dhivehi raajje","mv","mali","ml","malta","mt","marshall","mh","mauritania","muritaniyah","mr","mauritius","mu","micronesia","fm","moldova","md","monaco","mc","mongolia","mongol uls","mn","montenegro","crna gora","montserrat","ms","morocco","al maghrib","ma","mozambique","mocambique","mz","myanmar","myanma naingngandaw","mm","namibia","na","nauru","nr","nepal","np","caledonia","nouvelle","cal&eacute;donie","caledonie","nc","nicaragua","ni","niger","ne","nigeria","niue","nu","kp","oman","saltanat uman","pakistan","pk","palau","belau","pw","palestinian","ps","panama","pa","papua","papua niu gini","pg","paraguay","py","peru","pe","qatar","dawlat qatar","qa","romania","ro","rwanda","rw","helena","sh","kitts","nevis","kn","lucia","lc","vincent","grenadines","vc","samoa","american samoa","ws","san","marino","sm","sao","tome","principe","sao tome e principe","st","senegal","sn","serbia","srbija","rs","seychelles","sc","sierra","leone","sl","slovakia","sk","slovenia","slovenija","si","solomon","sb","somalia","so","sri","lanka","lk","sudan","as-sudan","sd","suriname","sr","swaziland","sz","syria","sy","taiwan","tw","tajikistan","jumhurii tojikiston","tj","tanzania","tz","prathet thai","th","togo","republique togolaise","tg","tonga","to","trinidad","tobago","tt","tunisia","tunis","tn","turkmenistan","tm","tuvalu","u.s.","virgin","vi","uganda","ug","ukraine","ukrayina","ua","uruguay","uy","uzbekistan","uzbekiston respublikasi","uz","vanuatu","vu","vatican","va","venezuela","ve","wallis","futuna","wf","sahara","aṣ-Ṣaḥrā’ al-gharbīyah","sahra","gharbiyah","eh","yemen","al yaman","ye","zambia","zm","zimbabwe","zw"];