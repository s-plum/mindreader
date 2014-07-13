(function ($) {
    var keyCode = {
        BACKSPACE: 8,
        DOWN: 40,
        ENTER: 13,
        ESCAPE: 27,
        HOME: 36,
        LEFT: 37,
        RIGHT: 39,
        TAB: 9,
        UP: 38
    };
    $.fn.mindreader = function (params) {
        if (params) return this.each(function (index, value) {
            //map parameters to local variables
            var ajaxUrl = params.ajaxUrl,
                parseMatches = params.parseMatches || null,
                matchSelected = params.matchSelected || null,
                postData = params.postData || null,
                actionType = params.actionType || 'POST',
                matchEvents = params.matchEvents || 'mouseover click',
                minLength = params.minLength || 1,
                searchPause = params.searchPause || 50,
                searchTimeout,
                //element variables
                $this = $(this),
                $parent = $(this).parent(),
            //add status box for accessibility - hidden container with text that will update with status of results for screen readers
                $statusBox = $('<span />', {
                    'role': 'status',
                    'class': 'mindreader-status',
                    'aria-live': 'polite'
                }),
                $results= $('<ul />', {
                    'class': 'mindreader-results',
                    'id': $this.attr('id') + '-mindreader'
                });
            $('body').append($statusBox).append($results);
            $(window).on('resize', positionResults);
            //on keydown, if tabbing, clear results
            $(document).on('keydown', '#' + $this.attr('id'), function (e) {
                var code = e.keyCode ? e.keyCode : e.which;
                switch (code) {
                    case keyCode.ESCAPE:
                        $this.val($this.attr('data-current-val'));
                        e.preventDefault();
                        clearResults();
                        break;
                    case keyCode.TAB:
                        console.log('test');
                        clearResults();
                        break;
                    case keyCode.ENTER:
                        if ($results.find('.active').length > 0) {
                            $($results.find('.active')[0]).trigger('click');
                            e.preventDefault();
                        }
                        else {
                            clearResults();
                        }
                        break;
                    case keyCode.UP:
                        e.preventDefault();
                        break;
                }
            })
            .on('keyup', '#' + $this.attr('id'), function (e) {
                clearTimeout(searchTimeout);
                var code = e.keyCode ? e.keyCode : e.which;
                switch (code) {
                    case keyCode.DOWN:
                        e.preventDefault();
                        if (!$results.is(':empty')) moveListSelection('next');
                        break;
                    case keyCode.UP:
                        e.preventDefault();
                        if (!$results.is(':empty')) moveListSelection('prev');
                        break;
                    case keyCode.ENTER:
                        if ($results.find('.active').length > 0) {
                            e.preventDefault();
                            clearResults();
                        }
                        else
                            break;
                    case keyCode.ESCAPE:
                        e.preventDefault();
                        clearResults();
                        break;
                    default:
                        //clear any previous results
                        var value = $(this).val();
                        $this.attr('data-current-val', value);
                        if (value.length >= minLength) {
                            searchTimeout = setTimeout(function () {
                                //gather any additional data for posting
                                if (postData != null && typeof postData == 'function' && typeof postData() == 'object') var dataObject = JSON.stringify(postData());
                                else var dataObject = null;
                                $.ajax({
                                    type: actionType,
                                    url: ajaxUrl + value, 
                                    data: dataObject,
                                    contentType: 'application/json',
                                    success: function (data) {
                                        if (typeof data == 'string') {
                                            data = $.parseJSON(data);
                                        }
                                        if ($.isArray(data) && data.length > 0 && parseMatches != null) {
                                            clearResults();
                                            $results.append($(parseMatches(data)));
                                            //update status to result count
                                            var resultCount = $results.find('li').length;
                                            var plural = resultCount > 1 ? 'es' : '';
                                            if (resultCount > 0) $statusBox.text(resultCount + ' suggested search' + plural + ' found. Use up and down arrow keys to navigate suggestions.');
                                            positionResults();
                                            showResults();
                                            $this.addClass('mindreader-results-open');
                                            //bind onclick for result list links
                                            $results.find('a').on('click', function () {
                                                $this.val($(this).text());
                                                clearResults();
                                                $this.focus();
                                                return false;
                                            }).on('mouseover', function () {
                                                $results.find('a').removeClass('active');
                                                $(this).addClass('active');
                                            });
                                            if (matchSelected != null) $results.find('a').on(matchEvents, matchSelected);
                                        }
                                    }
                                });
                            }, searchPause);
                        }
                        else {
                            clearResults();
                        }
                        break;
                }
            })
            .on('blur', '#' + $this.attr('id'), function () {
                setTimeout(function () {
                    if ($results.find('a:hover, a:focus, a:active').length == 0) {
                        clearResults();
                        $this.attr('data-current-val', '');
                    }
                }, 100);
            });

            function clearResults() {
                $this.removeClass('mindreader-results-open');
                $statusBox.text('');
                $results.empty();
                hideResults();
            };

            function positionResults() {
                var height = $this.outerHeight(),
                    width = $this.outerWidth(),
                    xpos = $this.offset().left,
                    ypos = $this.offset().top;
                $results.css({
                    'width': width + 'px',
                    'left': xpos + 'px',
                    'top': (ypos + height) + 'px'
                })
            }

            function showResults() {
                positionResults();
                $results.removeAttr('aria-hidden').show();
            }

            function hideResults() {
                $results.attr('aria-hidden','true').hide();
            }

            function moveListSelection(direction) {
                switch (direction) {
                    case 'next':
                        var openStart = 0;
                        var endListSelector = ':last-child';
                        break;
                    case 'prev':
                        var openStart = $results.children('li').length - 1;
                        var endListSelector = ':first-child';
                        break;
                }
                //if nothing is active
                if ($results.find('.active').length === 0) {
                    $($results.find('a')[openStart]).addClass('active');
                    $this.val($($results.find('.active')[0]).text());
                    $statusBox.text($($results.find('.active')[0]).text());
                    $($results.find('.active')[0]).trigger('mouseover');
                }

                    //if item at beginning/end of list is selected
                else if ($($results.find('.active')[0]).parent('li').is(endListSelector) || (direction === 'prev' && $($results.find('.active')[0]).parent('li').is(':first-child'))) {
                    $results.find('a').removeClass('active');
                    $this.val($this.attr('data-current-val'));
                    $statusBox.text($this.attr('data-current-val'));
                }

                    //if list is open, make next list item active
                else {
                    var currentItem = $($results.find('.active')[0]);
                    var nextItem = currentItem.parent('li')[direction]('li').children('a');
                    nextItem.addClass('active');
                    currentItem.removeClass('active');
                    $this.val($($results.find('.active')[0]).text());
                    $statusBox.text($($results.find('.active')[0]).text());
                    $($results.find('.active')[0]).trigger('mouseover');
                }
                return false;
            };
        });
    };
})(jQuery);
