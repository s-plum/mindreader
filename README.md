#mindreader.js

A tiny, all-knowing, screen-reader-friendly alternative to jQuery UI Autocomplete. See it in action at [s-plum.github.io/mindreader/](http://s-plum.github.io/mindreader/).

Mindreader gives an ordinary text or search input the extraordinary ability to provide suggested values for the user's input based on ajax requests made to an external service (service not included). The suggested values will display below the text box, where the user can choose one (with either a mouse or keyboard), or ignore them all completely and type onward.

##Become Psychic
All that your input needs to get in touch with its third eye is a unique id and a bit of styling and scripting.

###HTML
	<p>
        <label for="keyword-seach-sample">Keyword Search</label>
        <input type="search" id="keyword-search-sample"/>
    </p>

###CSS
	/* this is just the base - add on as needed */
	.mindreader-status {
		display: block;
		overflow: hidden;
		position: absolute;
		text-indent: -9999em;
	}
	.mindreader-results {
		list-style: none;
		margin: 0;
		padding: 0;
		position: absolute;
		text-align: left;
		z-index: 9999;
		&:empty {
			display: none;
		}
	}
	.mindreader-results li {
		margin: 0;
	}
	.mindreader-results a {
		display: block;
		text-decoration: none;
	}
	.mindreader-results a:hover, .mindreader-results a:focus, .mindreader-results a.active {
		/* add active color/style here to highlight the selected suggestion */
	}

###Javascript
    $('#keyword-search-sample').mindreader({
	    ajaxUrl: 'http://domain.com/search?term=', //external service
	    parseMatches: function(data) {
	    	//this function should be customized according to your data structure
	    	//for this example, data is an array of strings
	        var htmlString = '';
	        $.each(data, function (index, result) {
	           htmlString += '<li><a href="#">' + result + '</a></li>';
	        });
	        return htmlString;
	    }
	});

##Required Parameters
<dl>
<dt><code>ajaxUrl</code></dt>
<dd><i>string</i><br/>  
URL to send value as ajax request. URL should end in a query string parameter with an empty value (the value will be divined from the text field automatically).</dd>

<dt><code>parseMatches</code></dt>
<dd><i>function</i><br/>
Returns html string of parsed matches. Function should accept a json object as a parameter, and return an html string of <code>&lt;li&gt;</code> elements with inner <code>&lt;a&gt;</code> elements. Additional data attributes or markup can be added as needed.</dd>
</dl>

##Optional Parameters
<dl>
<dt><code>actionType</code></dt>
<dd><i>string, optional</i><br/>  
Define whether the ajax call should be <code>GET</code> or <code>POST</code> by declaring the appropriate action string. Default is <code>POST</code>.</dd>

<dt><code>matchEvents</code></dt>
<dd><i>string</i><br/>
Events on which the <code>matchSelected</code> function should fire. Default is <code>mouseover click</code>.</dd>

<dt><code>matchSelected</code></dt>
<dd><i>function</i><br/>  
Callback that will fire when user selects a match from the suggested result list. Function should return <code>false</code>.</dd>

<dt><code>minLength</code></dt>
<dd><i>integer</i><br/>
Minimum number of characters that user must enter before mindreader queries the service for suggestions. Default is <code>1</code>.
</dd>

<dt><code>postData</code></dt>
<dd><i>object or function that returns object</i><br/>
Additional data that will be passed back with the search string during the ajax request. Object will be serialized as JSON and passed to the predefined <code>ajaxUrl</code>.</dd>

<dt><code>searchPause</code></dt>
<dd><i>integer</i><br/>
Delay (in milliseconds) between last user keystroke and ajax request to external service. Default is <code>50</code>. 
</dd>
</dl>

##UI Expected Behaviors
* Search suggestions will display automatically as a dropdown-style list below the search/text input box if the ajax service that parses the query term returns at least one suggested search result.
* If the service returns no suggestions for a given text value, then no suggestions will be displayed under the search box.
* Once results are displayed on screen, the user can clear the suggestion list by:
    - Moving the mouse cursor out of the search/text field (triggering the text field blur event) OR
    - Pressing the Tab key (triggering the text field blur event) OR
    - Pressing the Escape key when suggestions are displayed OR
    - Selecting one of the suggestions (causing that suggestion to populate the field) OR
    - Typing a string that does not return any results from the ajax service.
5. If the user selects one of the suggested values, that value will automatically populate the search/text field. The user can select one of the suggestions by:
    - Clicking on one of the displayed suggestions with the mouse OR
    - Using the up/down arrow keys to navigate through the results and pressing Enter
6. If the user is using a screen reader while browsing the site, he/she will hear the following status updates while typing:
    - When results are displayed, the user will hear the number of suggested searches found, and instructions to use up/down arrows to navigate the suggested results.
    - If the user hits the up/down arrow keys to navigate suggestions, he/she will hear each suggestion announced as it is highlighted.
