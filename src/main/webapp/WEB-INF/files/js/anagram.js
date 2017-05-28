define([ "jquery", "fancybox/jquery.fancybox.pack" ], function($) {
	var Game = {
		type : "",
		author : {},
		anagram : {},
		points : 0,
		init : function() {
			$(document).bind("keydown keypress", function(e) {
				if (e.which == 8) { // 8 == backspace
					e.preventDefault();
					var word = $(".word.selected");
					if (word.length == 1) {
						var full = word.children(".box.full").last();
						if (full.length == 1) {
							if (Game.type == "period") {
								Game.period.targetHandler.call(full.get(0));
							} else if (Game.type == "author") {
								Game.author.targetHandler.call(full.get(0));
							}
						}
					}
				}
			});

			$("button#next").click(Game.next);
			$("button#skip").click(Game.skip);

			var select = $("select");
			$("select").change(function() {
				var selected = this.options[this.selectedIndex];
				if (selected.value != "") {
					if (Game.type == "period") {
						Game.period.finish();
					} else if (Game.type == "author") {
						Game.author.finish();
					}

					$("#next").attr("disabled", "disabled");
					$("#skip").removeAttr("disabled");
					$("#hints").html("&nbsp;");


					if (selected.className == "period") {
						Game.period.setNew(selected.value);
						$("#name").show();
					} else if (selected.className == "author") {
						Game.author.setNew(selected.value);
						$("#name").hide();
					}
				}
			});

			$.ajax({
				async : true,
				type : "GET",
				url : "/rest/authors/list",
				cache : false,
				success : function(data) {
					var select = $("select");
					select.append("<option/>")

					for (var i = 0; i < data.length; i++) {
						var author = data[i];
						var periodGroup = select.children(".period[value=" + author.period + "]");
						if (periodGroup.length == 0) {
							periodGroup = $("<option/>").addClass("period").text(author.period).attr("value", author.period);
							periodGroup.appendTo(select);
						}
						var authorOpt = $("<option/>").addClass("author").html("&nbsp;&nbsp;&nbsp;&nbsp;" + author.name).attr("value", author.name);
						authorOpt.insertAfter(periodGroup);
					}
				},
				dataType : "json"
			});
		},

		next : function() {
			$("#next").attr("disabled", "disabled");
			$("#skip").removeAttr("disabled");

			$(".box").off("click").removeClass("used", "full");

			$("#hints").html("&nbsp;");

			if (Game.type == "period") {
				Game.period.setNextAuthor();
			} else if (Game.type == "author") {
				Game.author.setNextAnagram();
			}
		},

		skip : function() {
			if (Game.type == "period") {
				Game.period.finish(false);
			} else if (Game.type == "author") {
				Game.author.finish(false);
			}
		},

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
		selectHandler : function() {
			var word = $(this).parent(".word");
			$(".word.selected").removeClass("selected");

			word.addClass("selected");
		}
	};

	Game.period = {
		links : {},
		count : 0,
		setNextAuthor : function() {
			var sentenceDiv = $("#sentence");
			var nameDiv = $("#name");

			var author = Game.period.currentAuthor = Game.period.authors[0];

			if (!author) {
				alert("V tem obdobju ni več avtorjev.");
			}

			$("body").keypress(Game.period.keyboardHandler);
			nameDiv.removeClass("finished").empty();

			if (author.name.replace(/\s+/g, '').length != author.first.words.replace(/\s+/g, '').length) {
				alert("Bad data in json store.");
				return;
			}

			// @formatter:off
			var content = author.first.sentence.replace(/ _ /g, "<div class='word-name before after'></div>").replace(/ _/g,
					"<div class='word-name before'></div>").replace(/_ /g, "<div class='word-name after'></div>").replace(/_/g,
					"<div class='word-name'></div>").replace(/%/g, "<span class='separator'></span>");
			// @formatter:on

			sentenceDiv.html(content);

			var wrappers = sentenceDiv.children(".word-name");

			var words = $(author.first.words.split(" "));

			if (wrappers.length != words.length)
				alert("Bad coding no. 2. Wrapper num does not match the word num. " + words.length + " vs " + wrappers.length);

			words.each(function(i, word) {
				$(word.split('')).each(function(index, character) {
					var box = $("<span class='box'>" + character + "</span>");
					box.click(Game.period.sourceHandler);
					box.attr("draggable", "true");
					box[0].addEventListener("dragstart", Game.period.dragstart);
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
					box[0].addEventListener("drop", Game.period.drop);
					box[0].addEventListener("dragover", Game.period.dragover);
					box.on("click.sel", Game.extras.selectHandler);
					namewrapper.append(box);
				});
			});

			Game.period.addTextHints(author.help);
			Game.period.addPictureHint(author.pictures[0]);
		},

		addTextHints : function(help) {
			$("body #helpcontainer").empty();
			$("#hints").empty();

			var content = $('<div class="texthint"/>').text(help[0]);
			Game.extras.uniqueId(content);
			$("body #helpcontainer").append(content);
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

			var splits = Game.period.currentAuthor.name.split(" ");
			var lastHelp = "Prvi črki imena in priimka:   " + splits[0][0] + Array(splits[0].length).join(" _") + "     " + splits[1][0]
					+ Array(splits[1].length).join(" _");

			var content = $('<div class="texthint"/>').text(lastHelp).css("white-space", "pre-wrap");
			Game.extras.uniqueId(content);
			$("body #helpcontainer").append(content);
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
			a.attr("href", "rest/author/" + Game.period.currentAuthor.name + "/image/main.jpg").append($("<span class='help'>&nbsp;</span>"));
			$("#hints").append(a);
			a.bind("click.an", Game.extras.hintHandler);
			a.fancybox({
				openEffect : 'none',
				closeEffect : 'none'
			});
		},

		setNew : function(periodName) {
			Game.type = "period";

			$.ajax({
				async : true,
				type : "GET",
				url : "/rest/period/" + periodName,
				cache : false,
				success : function(data) {
					Game.period.authors = data;
					Game.period.setNextAuthor();
				},
				dataType : "json"
			});
		},

		getEmpty : function() {
			var selected = $("#name .word.selected .box:not(.full)");

			return (selected.length > 0) ? selected.first() : $("#name .word .box:not(.full):first");
		},

		finish : function(solved) {
			solved = (typeof solved == "boolean") ? solved : true;

			$(".word").removeClass("selected").addClass("finished");

			$("#next").removeAttr("disabled");
			$("#skip").attr("disabled", "disabled");

			var boxes = $(".box");

			boxes.off("click");
			boxes.removeClass("used", "full");

			boxes.each(function(i, box) {
				box.removeEventListener("drop", Game.period.drop);
				box.removeEventListener("dragover", Game.period.dragover);
				box.removeEventListener("dragstart", Game.period.dragstart);
				box.removeAttribute("draggable");
			});

			if (Game.period.authors) {
				Game.period.authors = Game.period.authors.splice(1);
			}

			if (solved == false) {
				$(".word .box").html("&nbsp;").removeClass("full");

				$.each(Game.period.currentAuthor.name.replace(/\s+/g, '').split(""), function(index, char) {
					Game.period.getEmpty().html(char).addClass("full");
				});
			}
		},

		checkState : function() {
			if ($("#name .box").text() == Game.period.currentAuthor.name.replace(/\s+/g, '')) {
				Game.period.finish();
				return;
			}

			var correct = Game.period.currentAuthor.name.split(" ");

			var words = $("#name .word");
			words.each(function(index, word) {
				word = $(word);
				if (!word.hasClass("finished") && word.children(".box").text() == correct[index]) {
					word.addClass("finished");
					word.children(".box").off("click");
					Game.extras.selectHandler.call(words.not(".finished").first().children().get(0));
					return false;
				}
			});
		},

		getBox : function(letter) {
			var answer = $("#sentence .word-name .box:not(.used)").filter(function(index) {
				return (this.innerHTML.toLowerCase() == letter.toLowerCase());
			});

			return answer[0] || null;
		},

		sourceHandler : function() {
			var targetBox = Game.period.getEmpty();
			var sourceBox = $(this);
			Game.extras.uniqueId(targetBox);
			Game.extras.uniqueId(sourceBox);

			targetBox.text(sourceBox.text());
			targetBox.addClass("full");
			sourceBox.addClass("used");

			Game.period.links[targetBox[0].id] = sourceBox;

			sourceBox.off('click');
			targetBox.off("click.sel");
			targetBox.click(Game.period.targetHandler);

			targetBox[0].removeEventListener("drop", Game.period.drop);
			targetBox[0].removeEventListener("dragover", Game.period.dragover);
			sourceBox[0].removeEventListener("dragstart", Game.period.dragstart);
			sourceBox[0].removeAttribute("draggable");

			Game.extras.selectHandler.call(targetBox[0]);

			Game.period.checkState();
		},

		targetHandler : function() {
			var targetBox = $(this);
			var sourceBox = $(Game.period.links[this.id]);

			sourceBox.removeClass("used");
			targetBox.removeClass("full");
			targetBox.html("&nbsp;");
			targetBox.off('click');
			targetBox.on("click.sel", Game.extras.selectHandler);
			sourceBox.click(Game.period.sourceHandler);

			targetBox[0].addEventListener("drop", Game.period.drop);
			targetBox[0].addEventListener("dragover", Game.period.dragover);
			sourceBox[0].addEventListener("dragstart", Game.period.dragstart);
			sourceBox.attr("draggable", "true");

			Game.extras.selectHandler.call(targetBox[0]);
		},

		keyboardHandler : function(event) {
			if ((event.which <= 122 && event.which >= 97) || event.which == 269 || event.which == 382 || event.which == 353) {
				event.preventDefault();
				var box = Game.period.getBox(String.fromCharCode(event.which));
				if (box !== null) {
					Game.period.sourceHandler.call(box);
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

			Game.period.links[targetBox[0].id] = sourceBox;

			sourceBox.off('click');
			targetBox.off("click.sel");
			targetBox.click(Game.period.targetHandler);

			Game.extras.selectHandler.call(targetBox[0]);

			Game.period.checkState();
		},

		dragstart : function(ev) {
			Game.extras.uniqueId(ev.target);
			ev.dataTransfer.setData("text/plain", ev.target.id);
		}
	};

	var anag = {
		links : {},

		setNew : function(authorName) {
			Game.type = "author";

			$.ajax({
				async : true,
				type : "GET",
				url : "/rest/author/" + authorName,
				cache : false,
				success : function(data) {
					Game.author.current = data;
					Game.author.setNextAnagram();
				},
				dataType : "json"
			});
		},

		setNextAnagram : function() {
			$("body").off("keypress");
			$("body").keypress(Game.author.keyboardHandler);
			var anagram = Game.author.currentAnagram = Game.author.getRandom();

			var sentenceDiv = $("#sentence");

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
					box[0].addEventListener("drop", Game.author.drop);
					box[0].addEventListener("dragover", Game.author.dragover);
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
					box[0].addEventListener("dragstart", Game.author.dragstart);
					box.text(character);
					box.click(Game.author.sourceHandler);
					nameWrappers.eq(i).append(box);
				});
			});

			Game.author.addTextHints(Game.author.currentAnagram.help);
		},

		addTextHints : function(help) {
			$("body #helpcontainer").empty();
			$(help).each(function(index, text) {
				if (index > 2) {
					return;
				}
				var content = $('<div class="texthint"/>').text(text);
				Game.extras.uniqueId(content);
				$("body #helpcontainer").append(content);
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
			if ($("#sentence .word .box").text() == Game.author.currentAnagram.words.replace(/\s+/g, '')) {
				Game.author.finish();
				return;
			}

			var correct = Game.author.currentAnagram.words.split(" ");
			var words = $("#sentence .word");
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
			var targetBox = Game.author.getEmpty();
			var sourceBox = $(this);

			Game.extras.uniqueId(sourceBox[0]);
			Game.extras.uniqueId(targetBox[0]);

			targetBox.text(sourceBox.text());
			sourceBox.addClass("used");
			targetBox.addClass("full");

			Game.author.links[targetBox[0].id] = sourceBox;

			sourceBox.off('click');
			targetBox.click(Game.author.targetHandler);
			targetBox.off("click.sel");

			targetBox[0].removeEventListener("drop", Game.author.drop);
			targetBox[0].removeEventListener("dragover", Game.author.dragover);
			sourceBox[0].removeEventListener("dragstart", Game.author.dragstart);
			sourceBox[0].removeAttribute("draggable");

			Game.extras.selectHandler.call(targetBox[0]);

			Game.author.checkState();
		},

		finish : function(solved) {
			solved = (typeof solved == "boolean") ? solved : true;

			$(".word").addClass("finished").removeClass("selected");
			$("body").off("keypress");

			$("#next").removeAttr("disabled");
			$("#skip").attr("disabled", "disabled");

			var boxes = $(".box").off("click").removeClass("used", "full");

			boxes.each(function(i, box) {
				box.removeEventListener("dragstart", Game.author.dragstart);
				box.removeEventListener("drop", Game.author.drop);
				box.removeEventListener("dragover", Game.author.dragover);
				box.removeAttribute("draggable");
			});
			
			if (solved == false) {
				$(".word .box").html("&nbsp;").removeClass("full");

				$.each(Game.author.currentAnagram.words.replace(/\s+/g, '').split(""), function(index, char) {
					Game.author.getEmpty().html(char).addClass("full");
				});
			}
		},

		targetHandler : function() {
			var targetBox = $(this);
			var sourceBox = $(Game.author.links[this.id]);

			sourceBox.removeClass("used");
			targetBox.removeClass("full");
			targetBox.html("&nbsp;");
			targetBox.off('click');
			sourceBox.click(Game.author.sourceHandler);
			targetBox.on("click.sel", Game.extras.selectHandler);

			targetBox[0].addEventListener("drop", Game.author.drop);
			targetBox[0].addEventListener("dragover", Game.author.dragover);
			sourceBox[0].addEventListener("dragstart", Game.author.dragstart);
			sourceBox.attr("draggable", "true");

			Game.extras.selectHandler.call(targetBox[0]);
		},

		getEmpty : function() {
			var selected = $("#sentence .word.selected .box:not(.full)");

			return (selected.length > 0) ? selected.first() : $("#sentence .word .box:not(.full):first");
		},

		getBox : function(letter) {
			var answer = $("#sentence .word-name .box:not(.used)").filter(function(index) {
				return (this.innerHTML.toLowerCase() == letter.toLowerCase());
			});

			return answer[0] || null;
		},

		keyboardHandler : function(event) {
			// anagramHandler.call(getLetter)
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

			Game.author.links[targetBox[0].id] = sourceBox;

			sourceBox.off('click');
			targetBox.click(Game.author.targetHandler);
			targetBox.off("click.sel");

			Game.extras.selectHandler.call(targetBox[0]);

			Game.author.checkState();
		}
	};

	Game.author = anag;

	return Game;
});
