(function () {
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

    var classes = {
        status: 'mindreader-status',
        results: 'mindreader-results',
        active: 'active',
        nomatch: 'mindreader-nomatch',
        resultsOpen: 'mindreader-results-open'
    }

    var dataAttributes = {
        currentVal: 'data-current-val'
    };

    var defaults = {
        ajaxUrl: '',
        parseMatches: null,
        matchSelected: null,
        matchStatus: '{0} items found. Use up and down arrow keys to navigate.',
        noMatchStatus: null,
        postData: null,
        actionType: 'POST',
        matchEvents: 'mouseover click',
        minLength: 1,
        searchPause: 50,
        errorCallback: function() { return false; }
    };

    var Mindreader = {
        create: function () {
            var instance = Object.create(this);
            instance._construct.apply(instance, arguments);
            return instance;
        },
        _construct: function(elem, params) {
            this.el = elem;
            this.parent = elem.parent();
            this.params = $.extend({}, defaults, params);

            //add status box for accessibility - hidden container with text that will update with status of results for screen readers
            this.statusBox = $('<span />', {
                'role': 'status',
                'class': classes.status,
                'aria-live': 'polite'
            });
            this.results = $('<ul />', {
                'class': classes.results,
                'id': this.el.attr('id') + '-mindreader'
            });
            $('body').append(this.statusBox).append(this.results);
            this.bindDomEvents();
            this.searchTimeout;
        },
        bindDomEvents: function() {
            var self = this;
            $(window).on('resize', self.positionResults);

            //on keydown, if tabbing, clear results
            $(document).on('keydown', '#' + self.el.attr('id'), function (e) {
                var code = e.keyCode ? e.keyCode : e.which;
                switch (code) {
                    case keyCode.ESCAPE:
                        self.el.val(self.el.attr(dataAttributes.currentVal));
                        e.preventDefault();
                        self.clearResults();
                        break;
                    case keyCode.TAB:
                        self.clearResults();
                        break;
                    case keyCode.ENTER:
                        if (self.results.find('.' + classes.active).length > 0) {
                            $(self.results.find('.' + classes.active)[0]).trigger('click');
                            e.preventDefault();
                        }
                        else {
                            self.clearResults();
                        }
                        break;
                    case keyCode.UP:
                        e.preventDefault();
                        break;
                }
            })
            .on('keyup', '#' + self.el.attr('id'), function (e) {
                clearTimeout(self.searchTimeout);
                var code = e.keyCode ? e.keyCode : e.which;
                switch (code) {
                    case keyCode.DOWN:
                        e.preventDefault();
                        if (!self.results.is(':empty')) self.moveListSelection('next');
                        break;
                    case keyCode.UP:
                        e.preventDefault();
                        if (!self.results.is(':empty')) self.moveListSelection('prev');
                        break;
                    case keyCode.ENTER:
                        if (self.results.find('.' + classes.active).length > 0) {
                            e.preventDefault();
                            self.clearResults();
                        }
                        else
                            break;
                    case keyCode.ESCAPE:
                        e.preventDefault();
                        self.clearResults();
                        break;
                    default:
                        self.search();
                        break;
                }
            })
            .on('blur', '#' + self.el.attr('id'), function () {
                setTimeout(function () {
                    if (self.results.find('a:hover, a:focus, a:active').length == 0) {
                        self.clearResults();
                        self.el.attr(dataAttributes.currentVal, '');
                    }
                }, 100);
            });
        },
        search: function() {
            var self = this;
            //clear any previous results
            var value = self.el.val();
            self.el.attr(dataAttributes.currentVal, value);
            if (value.length >= self.params.minLength) {
                self.searchTimeout = setTimeout(function () {
                    //gather any additional data for posting
                    if (self.params.postData != null && typeof self.params.postData == 'function' && typeof self.params.postData() == 'object') var dataObject = JSON.stringify(self.params.postData());
                    else var dataObject = null;
                    $.ajax({
                        type: self.params.actionType,
                        url: self.params.ajaxUrl + value, 
                        data: dataObject,
                        contentType: 'application/json',
                        success: function (data) {
                            if (typeof data == 'string') {
                                data = $.parseJSON(data);
                            }
                            if ($.isArray(data) && self.params.parseMatches != null) {
                                self.parseResults(data);
                            }
                        },
                        error: self.params.errorCallback
                    });
                }, self.searchPause);
            }
            else {
                self.clearResults();
            }
        },
        parseResults: function(data) {
            var self = this;
            self.clearResults();
            if (data.length == 0) {
                if (self.params.noMatchStatus != null) {
                    self.results.append($('<li class="' + classes.nomatch + '">' + self.params.noMatchStatus + '</li>'));
                    self.statusBox.text(self.params.noMatchStatus);
                }
                self.positionResults();
                self.showResults();
                self.el.addClass(classes.resultsOpen);
                return false;
            }

            self.results.append($(self.params.parseMatches(data)));

            //update status to result count
            var resultCount = self.results.find('li').length;
            if (resultCount > 0) self.statusBox.text(self.params.matchStatus.replace("{0}", resultCount));
            self.positionResults();
            self.showResults();
            self.el.addClass(classes.resultsOpen);

            //bind onclick for result list links
            self.results.find('a').on('click', function (e) {
                self.el.val($(e.target).text());
                self.clearResults();
                self.el.focus();
                return false;
            }).on('mouseover', function (e) {
                self.results.find('a').removeClass(classes.active);
                $(e.target).addClass(classes.active);
            });
            if (self.params.matchSelected != null) self.results.find('a').on(self.params.matchEvents, self.params.matchSelected);
        },
        clearResults: function() {
            this.el.removeClass(classes.resultsOpen);
            this.statusBox.text('');
            this.results.empty();
            this.hideResults();
        },
        positionResults: function() {
            var height = this.el.outerHeight(),
                width = this.el.outerWidth(),
                xpos = this.el.offset().left,
                ypos = this.el.offset().top;
            this.results.css({
                'width': width + 'px',
                'left': xpos + 'px',
                'top': (ypos + height) + 'px'
            });
        },
        showResults: function() {
            this.positionResults();
            this.results.removeAttr('aria-hidden').show();
        },
        hideResults: function() {
            this.results.attr('aria-hidden','true').hide();
        },
        moveListSelection: function(direction) {
            var self = this;
            switch (direction) {
                case 'next':
                    var openStart = 0;
                    var endListSelector = ':last-child';
                    break;
                case 'prev':
                    var openStart = self.results.children('li').length - 1;
                    var endListSelector = ':first-child';
                    break;
            }
            //if nothing is active
            if (self.results.find('.' + classes.active).length === 0) {
                $(self.results.find('a')[openStart]).addClass(classes.active);
                self.el.val($(self.results.find('.' + classes.active)[0]).text());
                self.statusBox.text($(self.results.find('.' + classes.active)[0]).text());
                $(self.results.find('.' + classes.active)[0]).trigger('mouseover');
            }

            //if item at beginning/end of list is selected
            else if ($(self.results.find('.' + classes.active)[0]).parent('li').is(endListSelector) || (direction === 'prev' && $(self.results.find('.' + classes.active)[0]).parent('li').is(':first-child'))) {
                self.results.find('a').removeClass(classes.active);
                self.el.val(self.el.attr(dataAttributes.currentVal));
                self.statusBox.text(self.el.attr(dataAttributes.currentVal));
            }

            //if list is open, make next list item active
            else {
                var currentItem = $(self.results.find('.' + classes.active)[0]);
                var nextItem = currentItem.parent('li')[direction]('li').children('a');
                nextItem.addClass(classes.active);
                currentItem.removeClass(classes.active);
                self.el.val($(self.results.find('.' + classes.active)[0]).text());
                self.statusBox.text($(self.results.find('.' + classes.active)[0]).text());
                $(self.results.find('.' + classes.active)[0]).trigger('mouseover');
            }
            return false;
        }
    };

    $.fn.mindreader = function (params) {
        if (params) return this.each(function (i, v) {
            Mindreader.create($(v), params);
        });
    };
})();
