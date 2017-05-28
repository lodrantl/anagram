function getQueryParams(sParam) {
	var sPageURL = window.location.search.substring(1);
	var sURLVariables = sPageURL.split('&');
	for (var i = 0; i < sURLVariables.length; i++) {
		var sParameterName = sURLVariables[i].split('=');
		if (sParameterName[0] == sParam) {
			return decodeURIComponent(sParameterName[1]);
		}
	}
}

function imge() {
    $(this).parent().remove();
}

$(function() {
	var name = getQueryParams("name");

	if (name === null) {
		alert("Author not selected.");
		$("form :input").prop("disabled", true);
		return;
	}
	
	$("form input[name='name']").val(name).prop("readonly", true);

	$.get("/rest/image/upload/url", function(data, status, jqxhr) {
		uploadURL = jqxhr.getResponseHeader('Location');
		$('input#upload').click(function() {
			if ($("form input[type='file']").val() === "") {
				alert("Najprej izberi sliko.");
				return;
			}	
			if ($("form input[type='painter']").val() === "") {
				alert("Prosim vstavi ime avtorja. Če ga ne veš, v polje napiši /");
				return;
			}
			var formData = new FormData($('form')[0]);
			formData.append("uploaduri", uploadURL);
			
			$.ajax({
				url : "http://image-anagrammk.rhcloud.com/RepostServlet", // Server script to process data
				type : 'POST',
				xhr : function() { // Custom XMLHttpRequest
					var myXhr = $.ajaxSettings.xhr();
					if (myXhr.upload) { // Check if upload property exists
						myXhr.upload.addEventListener('progress', progressHandlingFunction, false); // For
					}
					return myXhr;
				},
				success : completeHandler,
				error : function(xhr, textStatus, errorThrown) {
					alert("Neuspeh pri nalaganju, server se je odzval z " + textStatus + "  " + errorThrown);
				},
				data : formData,
				cache : false,
				contentType : false,
				processData : false
			});
		});
	});

	var newimg = $('<img alt=""/>');
	newimg.error(imge);
	newimg.attr("src", "/rest/author/" + name + "/image/main.jpg");
	var newdiv = $('<div class="img"><button class="mdel">Odstrani</button></div>');
	
	newdiv.prepend(newimg);
	$("#imagewrapper").append(newdiv);

	$("button.mdel").click(function(e) {
		var img = $(e.target).siblings("img");
		$.ajax({
			url : img.attr("src"), // Server script to process data
			type : 'DELETE',
			success : function() {
				alert("Brisanje slike uspešno. Osvežujem stran.");
				location.reload();
			},
			error : function(xhr, textStatus, errorThrown) {
				alert("Neuspeh pri brisanju, server se je odzval z " + textStatus + "  " + errorThrown);
			}
		});
	});
	
	$.getJSON("/rest/author/" + name + "/image/array", function(data, status, jqxhr) {
		$.each(data, function(i, o) {
			$("#imagewrapper").append('<div class="img"><img src="' + o + '" alt=""/><button class="del">Odstrani</button><button class="ma">Nastavi za glavno</button></div>');
		});

		$("button.del").click(function(e) {
			var img = $(e.target).siblings("img");
			$.ajax({
				url : img.attr("src"), // Server script to process data
				type : 'DELETE',
				success : function() {
					alert("Brisanje slike uspešno. Osvežujem stran.");
					location.reload();
				},
				error : function(xhr, textStatus, errorThrown) {
					alert("Neuspeh pri brisanju, server se je odzval z " + textStatus + "  " + errorThrown);
				}
			});
		});
		
		$("button.ma").click(function(e) {
			var img = $(e.target).siblings("img");
			$.ajax({
				url : img.attr("src"), // Server script to process data
				type : 'POST',
				success : function() {
					alert("Nastavitev slike uspešna. Osvežujem stran.");
					location.reload();
				},
				error : function(xhr, textStatus, errorThrown) {
					alert("Neuspeh pri nastavljanju, server se je odzval z " + textStatus + "  " + errorThrown);
				}
			});
		});
	});
});

function completeHandler() {
	alert("Nalaganje slike uspelo. Osvežujem stran.");
	location.reload();
}

function progressHandlingFunction(e) {
	if (e.lengthComputable) {
		$('progress').attr({
			value : e.loaded,
			max : e.total
		});
	}
}