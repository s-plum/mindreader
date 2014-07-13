require(["jquery", "mindreader"], function($) {
	$('#mindreader-demo-input').mindreader({
		ajaxUrl: 'docs/js/fruits.json?q=',
		parseMatches: function(data) {
		    var htmlString = '';
		    //fake string parse matching to mimic ajax service that would return JSON results
		    $.each(data, function (index, result) {
		    	if (result.toLowerCase().indexOf($('#mindreader-demo-input').attr('data-current-val').toLowerCase()) >= 0) htmlString += '<li><a href="#">' + result + '</a></li>';
		    });
		    return htmlString;
		},
		actionType: 'GET',
		minLength: 2
	});
});

