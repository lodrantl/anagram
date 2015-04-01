define([ "jquery", "fancybox/jquery.fancybox.pack"], function($) {
	var Game = {
		author : {},
		anagram : {},
		points : 0,
		init : function() {
			this.validateSession();
			
			console.debug("Session cookie: " + Game.extras.readCookie("ASESSIONKEY"));

			window.onunload = function(e) {
				$.ajax({
					async : false,
					type : "POST",
					url : "/rest/invalidate",
				});
			};

			window.onbeforeunload = function(e) {
				return "Trenutni rezultat bo izgubljen.";
			};

			$(document).bind("keydown keypress", function(e) {
				if (e.which == 8) { // 8 == backspace
					e.preventDefault();
					var word = $(".word.selected");
					if (word.length == 1) {
						var full = word.children(".box.full").last();
						if (full.length == 1) {
							if (word.parent().get(0).id == "name") {
								Game.author.targetHandler.call(full.get(0));
							} else {
								Game.anagram.targetHandler.call(full.get(0));
							}
						}
					}
				}
			});

			$("button#next").click(Game.next);
			$("button#skip").click(Game.skip);
		},

		validateSession : function() {
			$.ajax({
				url : "/rest/validate",
				error : Game.extras.redirectHandler
			});
		},

		next : function() {
			$("#next").attr("disabled", "disabled");
			$("#skip").removeAttr("disabled");

			$(".box").off("click").removeClass("used", "full");

			$("#hints").html("&nbsp;");

			if (Game.anagram.count === null) {
				Game.author.setNew();
				$("#author-sentence").show();
				$("#anagram-sentence").hide().empty();
				$("#name").show();
			} else {
				$("#anagram-sentence").show();
				$("#author-sentence").hide().empty();
				$("#name").hide();
				Game.anagram.setNew();
			}
		},

		skip : function() {
			if (Game.anagram.count === null) { // searching author
				Game.author.finish(false);
			} else {
				Game.anagram.finish(false);
			}
		},

	};

	var Timer = {
		start : function(time) {
			Timer.clear();

			Timer.startTime = new Date();

			$("#timer").css("color", "");

			Timer.object = setInterval(Timer.setScreen, 1000);
		},

		setScreen : function() {
			var remains = Timer.getRemains();
			var mins = ~~(remains / 60);
			var secs = remains % 60;
			$("#timer").text("Še " + Timer.format(mins) + ":" + Timer.format(secs));

			if (remains < 60) {
				$("#timer").css("color", "#8C001A");
			} else if (remains < 120) {
				$("#timer").css("color", "#6F0564");
			}

			if (remains <= 0) {
				Timer.clear();
			}
		},

		getRemains : function() {
			return Math.round(420 - ((new Date() - Timer.startTime) / 1000));
		},

		clear : function() {
			if (Timer.object !== null) {
				clearInterval(Timer.object);
				Timer.object = null;
			}
		},
		format : function(num) {
			var s = "0" + num;
			return s.substr(s.length - 2);
		}
	};

	Game.extras = {
		uuid : 0,
		uniqueId : function(element) {
			element = $(element)[0];
			if (typeof element == "object" && !element.id) {
				element.id = "boxid-" + (++Game.extras.uuid);
			}
		},
		readCookie : function(name) {
			return (name = new RegExp('(?:^|;\\s*)' + ('' + name).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '=([^;]*)').exec(document.cookie))
					&& name[1];
		},
		hintHandler : function() {
			$(this).removeClass("unused").addClass("used");
		},
		redirectHandler : function(jqXHR) {
			if (jqXHR.status == 401) {
				var location = jqXHR.getResponseHeader("REDIRECT_LOC");
				if (location !== null) {
					window.onbeforeunload = null;
					alert("Session this has expired. Please start again.");
					window.location.replace(location);
				}
			}
		},
		selectHandler : function() {
			var word = $(this).parent(".word");
			$(".word.selected").removeClass("selected");

			word.addClass("selected");
		}
	};

	var auth = {
		links : {},
		count : 0,
		setNew : function() {
			$("body").keypress(Game.author.keyboardHandler);
			var author = Game.author.current = Game.author.getRandom();

			if (anagram === null) {
				$("#skip").attr("disabled", "disabled");
				alert("Igre je konec. Začni znova!");
				return;
			}

			var anagram = Game.author.current.first;

			var sentenceDiv = $("#author-sentence");
			var nameDiv = $("#name");

			nameDiv.removeClass("finished").empty();

			if (author.name.replace(/\s+/g, '').length != anagram.words.replace(/\s+/g, '').length) {
				alert("Bad data in json store.");
				return;
			}

			// @formatter:off
			var content = anagram.sentence.replace(/ _ /g, "<div class='word-name before after'></div>").replace(/ _/g,
					"<div class='word-name before'></div>").replace(/_ /g, "<div class='word-name after'></div>").replace(/_/g,
					"<div class='word-name'></div>").replace(/%/g, "<span class='separator'></span>");
			// @formatter:on

			sentenceDiv.html(content);

			var wrappers = sentenceDiv.children(".word-name");

			var words = $(anagram.words.split(" "));

			if (wrappers.length != words.length)
				alert("Bad coding no. 2. Wrapper num does not match the word num. " + words.length + " vs " + wrappers.length);

			words.each(function(i, word) {
				$(word.split('')).each(function(index, character) {
					var box = $("<span class='box'>" + character + "</span>");
					box.click(Game.author.sourceHandler);
					box.attr("draggable", "true");
					box[0].addEventListener("dragstart", Game.author.dragstart);
					wrappers.eq(i).append(box);
				});
			});

			$.each(author.name.split(" "), function(i, name) {
				var namewrapper = $("<div class='word after'/>");
				if (i === 0)
					namewrapper.addClass("selected");
				nameDiv.append(namewrapper);
				$.each(name.split(""), function(index, character) {
					var box = $("<span class='box'>&nbsp;</span>");
					box[0].addEventListener("drop", Game.author.drop);
					box[0].addEventListener("dragover", Game.author.dragover);
					box.on("click.sel", Game.extras.selectHandler);
					namewrapper.append(box);
				});
			});

			Game.author.addPictureHint(Game.author.current.pictures[0]);

			Game.author.addTextHints(Game.author.current.help);

			Timer.start();
		},

		addTextHints : function(help) {
			$("body #helpy").empty();

			var content = $('<div class="texthint"/>').text(help[0]);
			Game.extras.uniqueId(content);
			$("body #helpy").append(content);
			var a = $("<a/>").attr("href", "#" + content[0].id).append($("<span class='help'>&nbsp;</span>"));
			$("#hints").append(a);
			a.bind("click.an", Game.extras.hintHandler);
			a.fancybox({
				type : 'inline',
				openEffect : 'none',
				closeEffect : 'none',
				autoWidth : true,
				autoHeight : true,
				minWidth : 0,
				minHeight : 0
			});

			var splits = Game.author.current.name.split(" ");
			var lastHelp = "Prvi črki imena in priimka:   " + splits[0][0] + Array(splits[0].length).join(" _") + "     " + splits[1][0]
					+ Array(splits[1].length).join(" _");

			var content = $('<div class="texthint"/>').text(lastHelp).css("white-space", "pre-wrap");
			Game.extras.uniqueId(content);
			$("body #helpy").append(content);
			var a = $("<a/>").attr("href", "#" + content[0].id).append($("<span class='help'>&nbsp;</span>"));
			$("#hints").append(a);
			a.bind("click.an", Game.extras.hintHandler);
			a.fancybox({
				type : 'inline',
				openEffect : 'none',
				closeEffect : 'none',
				autoWidth : true,
				autoHeight : true,
				minWidth : 0,
				minHeight : 0
			});
		},

		addPictureHint : function(pic) {
			var a = $("<a title='Slika izbranega avtorja ------ narisal:  Vladimir Ribarič'/>");
			a.attr("href", "rest/author/" + Game.author.current.name + "/image/main.jpg").append($("<span class='help'>&nbsp;</span>"));
			$("#hints").append(a);
			a.bind("click.an", Game.extras.hintHandler);
			a.fancybox({
				openEffect : 'none',
				closeEffect : 'none'
			});
		},

		getRandom : function() {
			var answer = null;
			$.ajax({
				async : false,
				type : "GET",
				url : "/rest/author/REALIZEM/random",
				cache : false,
				success : function(data) {
					answer = data;
				},
				statusCode : {
					401 : Game.extras.redirectHandler
				},
				dataType : "json"
			});

			if (answer) {
				answer.points = 0;
			}

			return answer;
		},

		getEmpty : function() {
			var selected = $("#name .word.selected .box:not(.full)");

			return (selected.length > 0) ? selected.first() : $("#name .word .box:not(.full):first");
		},

		finish : function(solved) {
			solved = (typeof solved == "boolean") ? solved : true;

			Timer.clear();

			$(".word").removeClass("selected").addClass("finished");

			$("#next").removeAttr("disabled");
			$("#skip").attr("disabled", "disabled");

			$("body").off("keypress");

			var boxes = $(".box");

			boxes.off("click");
			boxes.removeClass("used", "full");

			boxes.each(function(i, box) {
				box.removeEventListener("drop", Game.author.drop);
				box.removeEventListener("dragover", Game.author.dragover);
				box.removeEventListener("dragstart", Game.author.dragstart);
				box.removeAttribute("draggable");
			});

			var row = $(".results table tr").eq(Game.author.count + 1).children("td");

			if (solved) {
				var finishTime = Timer.getRemains();
				var result = 16;
				if (finishTime >= 120) {
					result += 4;
				} else if (finishTime >= 60) {
					result += 2;
				}

				result -= ($("#hints a.used").length * 2);

				Game.author.current.points += result;
				Game.points += result;

				row.eq(0).text(Game.author.current.name);
				row.eq(1).text(result);
			} else {
				row.eq(0).text(Game.author.current.name);
				row.eq(1).text("#");
				row.eq(1).css("color", "#8C001A");

				$(".word .box").html("&nbsp;").removeClass("full");

				$.each(Game.author.current.name.replace(/\s+/g, '').split(""), function(index, char) {
					Game.author.getEmpty().html(char).addClass("full");
				});
			}

			row.last().text(Game.author.current.points);
			$(".results table tr:last-child td:last-child").text(Game.points);

			Game.anagram.count = 0;
		},

		checkState : function() {
			if ($("#name .box").text() == Game.author.current.name.replace(/\s+/g, '')) {
				Game.author.finish();
				return;
			}

			var correct = Game.author.current.name.split(" ");
			var words = $("#name .word");
			var change = false;
			words.each(function(index, word) {
				word = $(word);
				if (!word.hasClass("finished") && word.children(".box").text() == correct[index]) {
					word.addClass("finished");
					word.children(".box").off("click");
					change = true;
				}
			});

			if (change) {
				Game.extras.selectHandler.call(words.not(".finished").first().children().get(0));
			}

		},

		getBox : function(letter) {
			var answer = $("#author-sentence .word-name .box:not(.used)").filter(function(index) {
				return (this.innerHTML.toLowerCase() == letter.toLowerCase());
			});

			return answer[0] || null;
		},

		sourceHandler : function() {
			var targetBox = Game.author.getEmpty();
			var sourceBox = $(this);
			Game.extras.uniqueId(targetBox);
			Game.extras.uniqueId(sourceBox);

			targetBox.text(sourceBox.text());
			targetBox.addClass("full");
			sourceBox.addClass("used");

			Game.author.links[targetBox[0].id] = sourceBox;

			sourceBox.off('click');
			targetBox.off("click.sel");
			targetBox.click(Game.author.targetHandler);

			targetBox[0].removeEventListener("drop", Game.author.drop);
			targetBox[0].removeEventListener("dragover", Game.author.dragover);
			sourceBox[0].removeEventListener("dragstart", Game.author.dragstart);
			sourceBox[0].removeAttribute("draggable");

			Game.extras.selectHandler.call(targetBox[0]);

			Game.author.checkState();
		},

		targetHandler : function() {
			var targetBox = $(this);
			var sourceBox = $(Game.author.links[this.id]);

			sourceBox.removeClass("used");
			targetBox.removeClass("full");
			targetBox.html("&nbsp;");
			targetBox.off('click');
			targetBox.on("click.sel", Game.extras.selectHandler);
			sourceBox.click(Game.author.sourceHandler);

			targetBox[0].addEventListener("drop", Game.author.drop);
			targetBox[0].addEventListener("dragover", Game.author.dragover);
			sourceBox[0].addEventListener("dragstart", Game.author.dragstart);
			sourceBox.attr("draggable", "true");

			Game.extras.selectHandler.call(targetBox[0]);
		},

		keyboardHandler : function(event) {
			if ((event.which <= 122 && event.which >= 97) || event.which == 269 || event.which == 382 || event.which == 353) {
				event.preventDefault();
				var box = Game.author.getBox(String.fromCharCode(event.which));
				if (box !== null) {
					Game.author.sourceHandler.call(box);
				}
			}
		},

		dragover : function(ev) {
			ev.preventDefault();
		},

		drop : function(ev) {
			ev.preventDefault();

			var id = ev.dataTransfer.getData("text/plain");

			var sourceBox = $(document.getElementById(id));
			var targetBox = $(ev.target);

			Game.extras.uniqueId(sourceBox);
			Game.extras.uniqueId(targetBox);

			targetBox.text(sourceBox.text());
			targetBox.addClass("full");
			sourceBox.addClass("used");

			Game.author.links[targetBox[0].id] = sourceBox;

			sourceBox.off('click');
			targetBox.off("click.sel");
			targetBox.click(Game.author.targetHandler);

			Game.extras.selectHandler.call(targetBox[0]);

			Game.author.checkState();
		},

		dragstart : function(ev) {
			Game.extras.uniqueId(ev.target);
			ev.dataTransfer.setData("text/plain", ev.target.id);
		}
	};

	var anag = {
		links : {},
		count : null,
		setNew : function() {
			$("body").off("keypress");
			$("body").keypress(Game.anagram.keyboardHandler);
			var anagram = Game.anagram.current = Game.anagram.getRandom();

			var sentenceDiv = $("#anagram-sentence");

			// @formatter:off
			var content = anagram.sentence.replace(/ _ /g, "<div class='word before after'></div>").replace(/ _/g, "<div class='word before'></div>")
					.replace(/_ /g, "<div class='word after'></div>").replace(/_/g, "<div class='word'></div>").replace(/ \$ /g,
							"<div class='word-name before after'></div>").replace(/ \$/g, "<div class='word-name before'></div>").replace(/\$ /g,
							"<div class='word-name after'></div>").replace(/\$/g, "<div class='word-name'></div>").replace(/%/g,
							"<span class='separator'></span>");
			// @formatter:on

			sentenceDiv.html(content);

			var wrappers = sentenceDiv.children(".word");
			var words = $(anagram.words.split(" "));

			if (wrappers.length != words.length)
				alert("Bad coding no. 3.  " + wrappers.length + " != " + words.length);

			words.each(function(i, word) {
				$(word.split('')).each(function(index, character) {
					var box = $("<span class='box'>&nbsp;</span>");
					box[0].addEventListener("drop", Game.anagram.drop);
					box[0].addEventListener("dragover", Game.anagram.dragover);
					box.on("click.sel", Game.extras.selectHandler);
					wrappers.eq(i).append(box);
				});
			});

			wrappers.eq(0).addClass("selected");

			var nameWrappers = sentenceDiv.children(".word-name");
			var nameWords = $(Game.author.current.name.split(" "));

			if (nameWrappers.length != nameWords.length)
				alert("Bad coding no. 4.  " + nameWrappers.length + " != " + nameWords.length);

			nameWords.each(function(i, word) {
				$(word.split('')).each(function(index, character) {
					var box = $("<span class='box'>&nbsp;</span>");
					box.attr("draggable", "true");
					box[0].addEventListener("dragstart", Game.anagram.dragstart);
					box.text(character);
					box.click(Game.anagram.sourceHandler);
					nameWrappers.eq(i).append(box);
				});
			});

			Game.anagram.addTextHints(Game.anagram.current.help);

			Timer.start();
		},

		addTextHints : function(help) {
			$("body #helpy").empty();
			$(help).each(function(index, text) {
				if (index > 2) {
					return;
				}
				var content = $('<div class="texthint"/>').text(text);
				Game.extras.uniqueId(content);
				$("body #helpy").append(content);
				var a = $("<a/>").attr("href", "#" + content[0].id).append($("<span class='help'>&nbsp;</span>"));
				$("#hints").append(a);
				a.bind("click.an", Game.extras.hintHandler);
				a.fancybox({
					type : 'inline',
					openEffect : 'none',
					closeEffect : 'none',
					autoWidth : true,
					autoHeight : true,
					minWidth : 0,
					minHeight : 0
				});
			});
		},

		addPictureHint : function(pic) {
			var a = $("<a title='Slika izbranega avtorja.'/>");
			a.attr("href", "../img/authors/" + "askerc.jpg").append($("<span class='help'>&nbsp;</span>"));
			$("#hints").append(a);
			a.bind("click.an", Game.extras.hintHandler);
			a.fancybox({
				openEffect : 'none',
				closeEffect : 'none'
			});
		},
		getRandom : function() {
			var items = Game.author.current.anagram;
			var index = Math.floor(Math.random() * items.length);
			var anagram = items[index];
			Game.author.current.anagram.splice(index, 1);
			return anagram;
		},

		checkState : function() {
			if ($("#anagram-sentence .word .box").text() == Game.anagram.current.words.replace(/\s+/g, '')) {
				Game.anagram.finish();
				return;
			}

			var correct = Game.anagram.current.words.split(" ");
			var words = $("#anagram-sentence .word");
			var change = false;

			words.each(function(index, word) {
				word = $(word);
				if (!word.hasClass("finished") && word.children(".box").text() == correct[index]) {
					word.addClass("finished");
					word.children(".box").off("click");
					change = true;
				}
			});

			if (change) {
				Game.extras.selectHandler.call(words.not(".finished").first().children().get(0));
			}
		},

		sourceHandler : function() {
			var targetBox = Game.anagram.getEmpty();
			var sourceBox = $(this);

			Game.extras.uniqueId(sourceBox[0]);
			Game.extras.uniqueId(targetBox[0]);

			targetBox.text(sourceBox.text());
			sourceBox.addClass("used");
			targetBox.addClass("full");

			Game.anagram.links[targetBox[0].id] = sourceBox;

			sourceBox.off('click');
			targetBox.click(Game.anagram.targetHandler);
			targetBox.off("click.sel");

			targetBox[0].removeEventListener("drop", Game.anagram.drop);
			targetBox[0].removeEventListener("dragover", Game.anagram.dragover);
			sourceBox[0].removeEventListener("dragstart", Game.anagram.dragstart);
			sourceBox[0].removeAttribute("draggable");

			Game.extras.selectHandler.call(targetBox[0]);

			Game.anagram.checkState();
		},

		finish : function(solved) {
			solved = (typeof solved == "boolean") ? solved : true;

			Timer.clear();

			$(".word").addClass("finished").removeClass("selected");
			$("body").off("keypress");

			$("#next").removeAttr("disabled");
			$("#skip").attr("disabled", "disabled");

			var boxes = $(".box").off("click").removeClass("used", "full");

			boxes.each(function(i, box) {
				box.removeEventListener("dragstart", Game.anagram.dragstart);
				box.removeEventListener("drop", Game.anagram.drop);
				box.removeEventListener("dragover", Game.anagram.dragover);
				box.removeAttribute("draggable");
			});

			var row = $(".results table tr").eq(Game.author.count + 1).children("td");
			var result;
			if (solved) {
				var finishTime = Timer.getRemains();
				result = 8;
				if (finishTime >= 120) {
					result += 2;
				} else if (finishTime >= 60) {
					result += 1;
				}

				result -= ($("#hints a.used").length);

				Game.author.current.points += result;
				Game.points += result;

				row.eq(Game.anagram.count + 2).text(result);
			} else {
				row.eq(Game.anagram.count + 2).text("#").css("color", "#8C001A");

				$(".word .box").html("&nbsp;").removeClass("full");

				$.each(Game.anagram.current.words.replace(/\s+/g, '').split(""), function(index, char) {
					Game.anagram.getEmpty().html(char).addClass("full");
				});
				result = 0;
			}

			row.last().text(Game.author.current.points);
			$(".results table tr:last-child td:last-child").text(Game.points);

			if (Game.anagram.count == 2) {
				$.ajax({
					type : "POST",
					url : "/rest/score",
					data : {
						"points" : Game.author.current.points,
						"authorName" : Game.author.current.name
					},
					cache : false,
					error : Game.extras.redirectHandler
				});

				if (Game.author.count == 3) {
					$("#next").attr("disabled", "disabled");
					$("#skip").attr("disabled", "disabled");
					Game.over = true;
					alert("Bravo! Dosegli ste " + $(".results table tr:last-child td:last-child").text() + " točk.");
				} else {
					Game.author.current.points = 0;
					Game.author.count++;
					Game.anagram.count = null;
				}
			} else {
				Game.anagram.count++;
			}
		},

		targetHandler : function() {
			var targetBox = $(this);
			var sourceBox = $(Game.anagram.links[this.id]);

			sourceBox.removeClass("used");
			targetBox.removeClass("full");
			targetBox.html("&nbsp;");
			targetBox.off('click');
			sourceBox.click(Game.anagram.sourceHandler);
			targetBox.on("click.sel", Game.extras.selectHandler);

			targetBox[0].addEventListener("drop", Game.anagram.drop);
			targetBox[0].addEventListener("dragover", Game.anagram.dragover);
			sourceBox[0].addEventListener("dragstart", Game.anagram.dragstart);
			sourceBox.attr("draggable", "true");

			Game.extras.selectHandler.call(targetBox[0]);
		},

		getEmpty : function() {
			var selected = $("#anagram-sentence .word.selected .box:not(.full)");

			return (selected.length > 0) ? selected.first() : $("#anagram-sentence .word .box:not(.full):first");
		},

		getBox : function(letter) {
			var answer = $("#anagram-sentence .word-name .box:not(.used)").filter(function(index) {
				return (this.innerHTML.toLowerCase() == letter.toLowerCase());
			});

			return answer[0] || null;
		},

		keyboardHandler : function(event) {
			// anagramHandler.call(getLetter)
			if ((event.which <= 122 && event.which >= 97) || event.which == 269 || event.which == 382 || event.which == 353) {
				event.preventDefault();
				var box = Game.anagram.getBox(String.fromCharCode(event.which));
				if (box !== null) {
					Game.anagram.sourceHandler.call(box);
				}
			}
		},

		dragover : function(ev) {
			ev.preventDefault();
		},

		dragstart : function(ev) {
			Game.extras.uniqueId(ev.target);
			ev.dataTransfer.setData("Text", ev.target.id);
		},

		drop : function(ev) {
			ev.preventDefault();
			var id = ev.dataTransfer.getData("Text");

			var sourceBox = $(document.getElementById(id));
			var targetBox = $(ev.target);

			Game.extras.uniqueId(sourceBox);
			Game.extras.uniqueId(targetBox);

			targetBox.text(sourceBox.text());
			sourceBox.addClass("used");
			targetBox.addClass("full");

			Game.anagram.links[targetBox[0].id] = sourceBox;

			sourceBox.off('click');
			targetBox.click(Game.anagram.targetHandler);
			targetBox.off("click.sel");

			Game.extras.selectHandler.call(targetBox[0]);

			Game.anagram.checkState();
		}
	};

	Game.author = auth;
	Game.anagram = anag;

	return Game;
});
