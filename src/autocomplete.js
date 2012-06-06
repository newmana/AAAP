/*
 *  AAAP Version 1.0
 *  (c) 2010 Tomas Kirda
 *  (c) 2011 Andrew Newman
 *
 *  Web site: https://github.com/newmana/AAAP
 *
 * AAAP is freely distributable under the terms of an MIT-style license.
 * Original code Ajax AutoComplete for Prototype: http://www.devbridge.com/projects/autocomplete/
 */

var Autocomplete = function (el, options) {
    this.el = $(el);
    this.id = this.el.identify();
    this.el.setAttribute('autocomplete', 'off');
    this.badQueries = [];
    this.intervalId = 0;
    this.cachedResponse = [];
    this.instanceId = null;
    this.onChangeInterval = null;
    this.ignoreValueChange = false;
    this.serviceUrl = options.serviceUrl;
    this.parameters = options.parameters;
    this.currentValue = this.el.value;
    this.list = new AutocompleteList();
    this.options = {
        autoSubmit : false,
        minChars : 1,
        maxHeight : 300,
        deferRequestBy : 0,
        width : 0,
        container : null,
        autoHide : true
    };
    if (options) {
        Object.extend(this.options, options);
    }
    if (Autocomplete.isDomLoaded) {
        this.initialize();
    } else {
        Event.observe(document, 'dom:loaded', this.initialize.bind(this), false);
    }
};

Autocomplete.instances = [];
Autocomplete.isDomLoaded = false;

Autocomplete.getInstance = function (id) {
    var instances = Autocomplete.instances;
    var i = instances.length;
    while (i--) {
        if (instances[i].id === id) {
            return instances[i];
        }
    }
};

Autocomplete.highlight = function (value, re) {
    return value.replace(re, function (match) {
        return '<strong>' + match + '<\/strong>'
    });
};

Autocomplete.prototype = {

    killerFn : null,

    initialize : function () {
        var me = this;
        this.killerFn = function (e) {
            var element = $(Event.element(e));
            if (element && element.up !== undefined && !element.up('.autocomplete')) {
                me.killSuggestions();
                me.disableKillerFn();
            }
        }.bindAsEventListener(this);

        if (!this.options.width) {
            this.options.width = this.el.getWidth();
        }

        var div = new Element('div', { style : 'position:absolute;' });
        div.update('<div class="autocomplete-w1"><div class="autocomplete-w2"><div class="autocomplete" id="Autocomplete_' + this.id + '" style="display:none; width:' + this.options.width + 'px;"></div></div></div>');

        this.options.container = $(this.options.container);
        if (this.options.container) {
            this.options.container.appendChild(div);
            this.fixPosition = function () {
            };
        } else {
            document.body.appendChild(div);
        }

        this.mainContainerId = div.identify();
        this.container = $('Autocomplete_' + this.id);
        this.fixPosition();

        Event.observe(this.el, window.opera ? 'keypress' : 'keydown', this.onKeyPress.bind(this));
        Event.observe(this.el, 'keyup', this.onKeyUp.bind(this));
        Event.observe(this.el, 'blur', this.enableKillerFn.bind(this));
        Event.observe(this.el, 'focus', this.fixPosition.bind(this));
        Event.observe(this.el, 'select', this.textSelected.bind(this));
        if (this.options.maxHeight !== -1) {
            this.container.setStyle({ maxHeight : this.options.maxHeight + 'px' });
        }
        this.instanceId = Autocomplete.instances.push(this) - 1;
        if (!this.options.autoHide) {
            this.container.show();
        }
    },

    textSelected : function () {
        this.selectedNow = true;
        this.onValueChange();
    },

    fixPosition : function () {
        var offset = this.el.cumulativeOffset();
        $(this.mainContainerId).setStyle({ top : (offset.top + this.el.getHeight()) + 'px', left : offset.left + 'px' });
    },

    enableKillerFn : function () {
        Event.observe(document.body, 'click', this.killerFn);
    },

    disableKillerFn : function () {
        Event.stopObserving(document.body, 'click', this.killerFn);
    },

    killSuggestions : function () {
        this.stopKillSuggestions();
        this.intervalId = window.setInterval(function () {
            this.hide();
            this.stopKillSuggestions();
        }.bind(this), 300);
    },

    stopKillSuggestions : function () {
        window.clearInterval(this.intervalId);
    },

    onKeyPress : function (e) {
        switch (e.keyCode) {
            case Event.KEY_DELETE:
                if (this.selectedNow) {
                    this.hide();
                    this.selectedNow = false;
                }
                this.onKeypressed(e);
                return;
                break;
            case Event.KEY_ESC:
                this.updateValue(this.currentValue);
                this.hide();
                break;
            case Event.KEY_TAB:
            case Event.KEY_RETURN:
                if (this.list.atBeginning()) {
                    this.hide();
                    Event.stop(e);
                    return;
                }
                this.select(this.list.selectedIndex);
                if (e.keyCode === Event.KEY_TAB) {
                    return;
                }
                break;
            case Event.KEY_UP:
                this.moveUp();
                break;
            case Event.KEY_DOWN:
                this.moveDown();
                break;
            default:
                this.onKeypressed(e);
                return;
        }
        Event.stop(e);
    },

    onKeyUp : function (e) {
        switch (e.keyCode) {
            case Event.KEY_UP:
            case Event.KEY_DOWN:
                return;
        }
        clearInterval(this.onChangeInterval);
        if (this.currentValue !== this.el.value) {
            if (this.options.deferRequestBy > 0) {
                // Defer lookup in case when value changes very quickly:
                this.onChangeInterval = setInterval((function () {
                    this.onValueChange();
                }).bind(this), this.options.deferRequestBy);
            } else {
                this.onValueChange();
            }
        }
    },

    onValueChange : function () {
        clearInterval(this.onChangeInterval);
        this.currentValue = this.el.value;
        this.list.selectedIndex = -1;
        if (this.ignoreValueChange) {
            this.ignoreValueChange = false;
            return;
        }
        if (this.currentValue === '' || this.currentValue.length < this.options.minChars) {
            this.hide();
        } else {
            this.getSuggestions();
        }
    },

    getSuggestions : function () {
        var cr = this.cachedResponse[this.currentValue];
        if (cr && Object.isArray(cr.suggestions)) {
            this.list.setWithResponse(cr);
            this.suggest();
        } else if (!this.isBadQuery(this.currentValue)) {
            var options = new Object();
            options.parameters = new Object();
            for (var property in this.parameters) {
                if (this.parameters[property] instanceof Function) {
                    options.parameters[property] = this.parameters[property].call();
                } else {
                    options.parameters[property] = this.parameters[property];
                }
            }
            options.parameters.query = this.currentValue;
            options.onComplete = this.processResponse.bind(this);
            options.method = 'get';
            new Ajax.Request(this.serviceUrl, options);
        } else {
            this.onNoResults(this.currentValue);
        }
    },

    isBadQuery : function (q) {
        var i = this.badQueries.length;
        while (i--) {
            if (q.indexOf(this.badQueries[i]) === 0) {
                return true;
            }
        }
        return false;
    },

    hide : function () {
        if (this.options.autoHide) {
            this.enabled = false;
            this.container.hide();
        }
    },

    suggest : function () {
        if (this.list.emptySuggestions()) {
            this.hide();
            this.container.hide();
        } else {
            var content = [];
            var re = new RegExp('\\b' + this.currentValue.match(/\w+/g).join('|\\b'), 'gi');
            this.list.activeSuggestions().each(function (value, i) {
                var divClass = value[1] ? value[1] : "";
                var startDiv = '<div class="' + divClass;
                startDiv += this.list.isSelected(i) ? ' selected"' : '"';
                content.push(startDiv, ' title="', value[0], '" onclick="Autocomplete.instances[');
                content.push(this.instanceId, '].select(', i, ');" onmouseover="Autocomplete.instances[');
                content.push(this.instanceId, '].activate(', i, ');">', '<span class="type"></span>');
                content.push(Autocomplete.highlight(value[0], re), '</div>');
            }.bind(this));
            this.enabled = true;
            this.container.update(content.join('')).show();
        }
    },

    processResponse : function (xhr) {
        var response;
        try {
            response = xhr.responseText.evalJSON();
            if (!Object.isArray(response.data)) {
                response.data = [];
            }
        } catch (err) {
            return;
        }
        this.cachedResponse[response.query] = response;
        if (response.suggestions.length === 0) {
            this.badQueries.push(response.query);
            this.hide();
            this.onNoResults(response.query);
        }
        if (response.query === this.currentValue) {
            this.list = new AutocompleteList();
            this.list.setWithResponse(response);
            this.suggest();
            this.onSuggestion(response.suggestions);
        }
    },

    activate : function (index) {
        var divs = this.container.childNodes;
        var activeItem;
        // Clear previous selection:
        if (!this.list.atBeginning() && divs.length > this.list.selectedIndex) {
            divs[this.list.selectedIndex].removeClassName('selected');
        }
        this.list.selectedIndex = index;
        if (!this.list.atBeginning() && divs.length > this.list.selectedIndex) {
            activeItem = divs[this.list.selectedIndex];
            activeItem.addClassName('selected');
        }
        return activeItem;
    },

    deactivate : function (div, index) {
        div.className = '';
        if (this.list.selectedIndex === index) {
            this.list.selectedIndex = -1;
        }
    },

    select : function (index) {
        var selectedIndexAndValue = this.list.getEntryIndex(index);
        var selectedValue = selectedIndexAndValue[1][0];
        if (selectedValue) {
            if (this.autoHide) {
                this.updateValue(selectedValue);
            } else {
                this.updateValue(this.currentValue);
            }
            if (this.options.autoSubmit && this.el.form) {
                this.el.form.submit();
            }
            this.ignoreValueChange = true;
            this.hide();
            this.onSelect(index, selectedIndexAndValue);
        }
    },

    moveUp : function () {
        if (this.list.atBeginning()) {
            return;
        }
        if (this.list.selectedIndex === 0) {
            this.container.childNodes[0].removeClassName('selected');
            this.list.selectedIndex = -1;
            this.updateValue(this.currentValue);
            return;
        }
        this.adjustScroll(this.list.selectedIndex - 1);
    },

    moveDown : function () {
        if (this.list.atEnd()) {
            return;
        }
        this.adjustScroll(this.list.selectedIndex + 1);
    },

    adjustScroll : function (i) {
        var container = this.container;
        var activeItem = this.activate(i);
        var offsetTop = activeItem.offsetTop;
        var upperBound = container.scrollTop;
        var lowerBound = upperBound + this.options.maxHeight - 25;
        if (offsetTop < upperBound) {
            container.scrollTop = offsetTop;
        } else if (offsetTop > lowerBound) {
            container.scrollTop = offsetTop - this.options.maxHeight + 25;
        }
        this.updateValue(this.list.getSelectedValue()[0]);
    },

    updateValue : function (value) {
        this.el.value = value.replace(/ *\(.*\)/, "");
    },

    onSelect : function (origIndex, selectedIndexAndValue) {
        var selectedIndex = selectedIndexAndValue[0];
        var selectedValue = selectedIndexAndValue[1];
        var selectedData = this.list.data[selectedIndex];
        (this.options.onSelect || Prototype.emptyFunction)(origIndex, selectedValue, selectedData);
    },

    onNoResults : function (currentValue) {
        (this.options.onNoResults || Prototype.emptyFunction)(currentValue);
    },

    onKeypressed : function (e) {
        (this.options.onKeypressed || Prototype.emptyFunction)(e);
    },

    onSuggestion : function (suggestions) {
        (this.options.onSuggestion || Prototype.emptyFunction)(this.suggestions);
    }
};

var AutocompleteList = function () {
    this.selectedIndex = -1;
    this.suggestions = [];
    this.suggestionList = [];
    this.data = [];
};

AutocompleteList.prototype = {
    atBeginning : function() {
        return this.selectedIndex === -1;
    },

    atEnd : function() {
        return this.selectedIndex === this.suggestionList.entries().length - 1;
    },

    isSelected : function(index) {
        return this.selectedIndex === index;
    },

    createSuggestionList : function () {
        var thisSuggestionList = this.suggestionList;
        this.suggestions.each(function (value, index) {
            thisSuggestionList.push(index);
        });
    },

    emptySuggestions : function() {
        return this.suggestionList.entries().length === 0;
    },

    activeSuggestions : function() {
        var activeSuggestions = [];
        var auto = this;
        this.suggestionList.entries().each(function (index, i) {
            activeSuggestions.push(auto.suggestions[index]);
        });
        return activeSuggestions;
    },

    getEntryIndex : function (index) {
        var indexToSuggestion = this.suggestionList.entries()[index];
        return [indexToSuggestion, this.suggestions[indexToSuggestion]];
    },

    getSelectedValue : function () {
        return this.getEntryIndex(this.selectedIndex)[1];
    },

    removeSuggestion : function (index) {
        var entryIndex = this.getEntryIndex(index);
        delete this.suggestionList[entryIndex[0]];
        if (this.selectedIndex > 0) {
            this.selectedIndex--;
        }
        return entryIndex;
    },

    addSuggestion : function (entryIndex) {
        this.suggestionList[entryIndex] = entryIndex;
    },

    setWithResponse : function (response) {
        this.suggestions = response.suggestions;
        this.data = response.data;
        this.createSuggestionList();
    }
};

Event.observe(document, 'dom:loaded', function () {
    Autocomplete.isDomLoaded = true;
}, false);
