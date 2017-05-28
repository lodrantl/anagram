var div = $("#anagrams");
var first = true;
function newAnagram() {
	var root = $("#anagrams");
	var newParent = $("<div class='anagram'/>");
	var newWords = $("<input/>");
	var newSentence = $("<textarea/>");
	var newButton = $("<button class='helpa'>Nova pomoč</button>").click(newHelp);
	if (first)
		newParent.append("<p>Besede iz katerih je sestavljeno avtorjevo ime.</p>");
	newParent.append(newWords);
	if (first)
		newParent.append("<p>Poved v kateri so besede uporabljene. Same besede so zamenjane z podčrtaji (_).</p>");
	newParent.append(newSentence).append("<p>Pomoč</p>").append(newButton);
	root.append(newParent);
	first = false;
	$(document).scrollTop($(document).height());
}

function newHelp(parent) {
	if (parent.target) {
		$(parent.target).before("<input class='help'/>");
	} else {
		$(parent).before("<input class='help'/>");
	}
}

function newPic(parent) {
	$(this).before("<input class='pic'/>");
}

function generateObject() {
	var end = false;

	var object = {
		name : $("#name").val(),
		period : $("#period").val(),
		pictures : $("#pic").val(),
		first : {
			words : $("#firstwords").val(),
			sentence : $("#firstsentence").val()
		}
	};
	var length = object.name.replace(/\s/g, "").length;

	if (object.name == "" || object.first.sentence == "" || object.first.words == "") {
		alert("Zahtevana polja so prazna.");
		return null;
	}

	if (object.first.words.replace(/\s/g, "").length != length) {
		end = true;
	}

	object.help = [];

	$("#basic .help").each(function() {
		if (this.value != "")
			object.help.push(this.value);
	});

	object.pictures = [];

	$("#basic .pic").each(function() {
		if (this.value != "")
			object.pictures.push(this.value);
	});

	object.anagram = [];

	$("#anagrams div").each(function(i) {
		var a = {};
		a.words = $(this).children("input").first().val();
		a.sentence = $(this).children("textarea").val().replace(object.name, "$%$");
		a.help = [];

		if (a.words == "" || a.sentence == "") {
			return true;
		}

		$(".help", this).each(function() {
			if (this.value != "")
				a.help.push(this.value);
		});
		if (a.words.replace(/\s/g, "").length != length) {
			end = true;
		}

		object.anagram[i] = a;
	});

	if (end) {
		object = null;
		alert("Number of letters in name doesn't match the number of letters in one of the anagrams.");
	}

	return object;
}

function saveToServer() {
	var obj = generateObject();
	if (obj === null) {
		return;
	}
	App.authors[obj.name] = obj;
	if ($("select option[value='" + obj.name + "']").length === 0) {
		$("select").append($("<option>").attr("value", obj.name).text(obj.name)).val(obj.name);
	}

	var sData = JSON.stringify(obj);

	$.ajax({
		type : 'PUT',
		url : "/rest/author/" + obj.period + "/" + obj.name,
		data : sData,
		success : function(data) {
			console.log("Saved the data.");
			alert("Avtor uspešno shranjen.");
		},
		error : function(xhr, textStatus, errorThrown) {
			alert("Neuspeh pri shranjevanju, server se je odzval z " + textStatus + "  " + errorThrown);
		},
		contentType : "application/json; charset=UTF-8"
	});
}

function loadAuthor(authorName) {
	var a = App.authors[authorName];
	clearPage(true);

	$("#name").val(a.name).attr("disabled", "disabled");
	$("#period").val(a.period);
	$("#firstwords").val(a.first.words);
	$("#firstsentence").val(a.first.sentence);

	$("#basic .help").remove();

	$.each(a.help, function(i, o) {
		$("#pom").before($("<input class='help'/>").val(o));
	});

	$("#basic .pic").remove();

	$.each(a.pictures, function(i, o) {
		$("#sli").before($("<input class='pic'/>").val(o));
	});

	$.each(a.anagram, function(i, o) {
		newAnagram();

		var anagram = $("#anagrams .anagram").last();

		anagram.children("input").first().val(o.words);
		anagram.children("textarea").first().val(o.sentence);

		$.each(o.help, function(index, help) {
			anagram.children(".helpa").before($("<input class='help'/>").val(help));
		});
	});

}

function clearPage(sel) {
	$("#basic").html(App.original);
	$("#anagrams").empty();

	if (!sel) {
		$("select").val('');
	}
}
var App = {};

function init() {
	App.original = $("#basic").html();
	$.getJSON("/rest/authors/full", function(data) {
		App.authors = {};

		$.each(data, function(i, author) {
			App.authors[author.name] = author;
			$("#authorsel").append('<option value="' + author.name + '"">' + author.name + '</option>');
		});

		$("#authorsel").change(function() {
			loadAuthor($(this).val());
		});

		$("#authorsel").val('');
	});
}

function deleteCurrent() {
	var name = $("select").val();
	if (name == null || name == "") {
		alert("Noben avtor ni izbran.");
		return;
	}
	if (confirm("Ali ste prepričani da želite odstraniti trenutnega avtorja (" + name + ")?")) {
		$.ajax({
			type : 'DELETE',
			url : "/rest/author/" + name,
			success : function(data) {
				$("select option[value='" + name + "']").remove();
				delete App.authors[name];
				clearPage();
				alert("Avtor uspešno izbrisan.");
			},
			error : function(xhr, textStatus, errorThrown) {
				alert("Neuspeh pri brisanju, server se je odzval z " + textStatus + "  " + errorThrown);
			}
		});
	}
}

function editPics() {
	var name = $("select").val();
	if (name === null) {
		alert("Izberi avtorja ali pa shrani trenutnega pred urejanjem slik.");
		return;
	}
	var newwindow = window.open("/upload-image?name=" + name, "_blank");
	if (window.focus) {
		newwindow.focus();
	}
}
$(init);