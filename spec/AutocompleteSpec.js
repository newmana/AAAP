describe("autocomplete", function () {

    beforeEach(function () {
        setFixtures('<input type="text" name="wunderbar" id="query"/><div id="container"/>');
        auto = new Autocomplete("query", {
            serviceUrl:"/object",
            container:"container"
        });
        auto.isDomLoaded = true;
        auto.initialize();
    });

    describe("check suggest", function () {
        beforeEach(function () {
            auto.currentValue = 'a';
            auto.suggestions = [ ['banana'], ['peach'], ['pear'], ['grape'] ];
            auto.data = [ 'fruit_1', 'fruit_2', 'fruit_3', 'fruit_4'];
            auto.createSuggestionList();
            auto.suggest();
        });

        it("valid suggestions causes update to DOM", function () {
            expect(auto.enabled).toBe(true);
            expect($('container')).toContain('div[title=banana]');
            expect($('container')).toContain('div[title=peach]');
        });

        it("check that the length of the active suggestions equals the suggest list key size", function() {
            expect(auto.activeSuggestions().length).toEqual(auto.suggestionList.entries().length);
            var suggestion = auto.removeSuggestion(0);
            expect(auto.activeSuggestions().length).toEqual(auto.suggestionList.entries().length);
            auto.addSuggestion(suggestion[0]);
            expect(auto.activeSuggestions().length).toEqual(auto.suggestionList.entries().length);
        });

        it("move up at the top can go no further, and move down two then up", function () {
            checkMoveUp(-1, "");
            checkMoveDown(0, "banana");
            checkMoveDown(1, "peach");
            checkMoveDown(2, "pear");
            checkMoveDown(3, "grape");
            checkMoveDown(3, "grape");
            checkMoveUp(2, "pear");
            checkMoveUp(1, "peach");
            checkMoveUp(0, "banana");
            checkMoveUp(-1, "a");
        });

        it("removal all but first, check move down", function () {
            auto.removeSuggestion(1);
            auto.removeSuggestion(1);
            auto.removeSuggestion(1);
            checkMoveDown(0, "banana");
            checkMoveDown(0, "banana");
        });

        it("check moving with removal", function () {
            checkMoveUp(-1, "");
            checkMoveDown(0, "banana");
            checkMoveDown(1, "peach");
            checkMoveDown(2, "pear");
            var suggestion = auto.removeSuggestion(1);
            expect(suggestion[1]).toEqual(["peach"])
            checkMoveUp(0, "banana");
            checkMoveUp(-1, "a");
        });

        function checkMoveUp(expectedIndex, expectedValue) {
            auto.moveUp();
            expect(auto.selectedIndex).toEqual(expectedIndex);
            expect(auto.el.value).toEqual(expectedValue);
        }

        function checkMoveDown(expectedIndex, expectedValue) {
            auto.moveDown();
            expect(auto.selectedIndex).toEqual(expectedIndex);
            expect(auto.el.value).toEqual(expectedValue);
        }
    });

    describe("check select", function () {
        beforeEach(function () {
            auto.currentValue = 'a';
            auto.suggestions = [ ['banana'], ['peach'], ['pear'], ['grape'] ];
            auto.data = [ 'fruit_1', 'fruit_2', 'fruit_3', 'fruit_4'];
            auto.createSuggestionList();
        });

        it("select within range", function () {
            spyOn(auto, 'onSelect');
            checkSelect(0, "banana");
            checkSelect(1, "peach");
            checkSelect(2, "pear");
            checkSelect(3, "grape");
        });

        it("select within range after adding/removing", function() {
            spyOn(auto, 'onSelect');
            checkSelect(1, "peach");
            var suggestion = auto.removeSuggestion(1);
            checkSelect(1, "pear");
            auto.addSuggestion(suggestion[0]);
            checkSelect(1, "peach");
        });

        it("test onSelect", function() {
            auto.options.onSelect = function(index, suggestion, data) {
                expect(index).toEqual(1);
                expect(suggestion).toEqual("peach");
                expect(data).toEqual("fruit_2");
            };
            auto.select(1);
        });

        it("test onSelect with remove", function() {
            auto.options.onSelect = function(index, suggestion, data) {
                expect(index).toEqual(2);
                expect(suggestion).toEqual("pear");
                expect(data).toEqual("fruit_3");
            };
            auto.removeSuggestion(1);
            auto.select(1);
            expect(auto.selectedIndex).toEqual(-1);
        });

        it("suggestion list generation", function () {
            expect(auto.suggestionList).toEqual([0, 1, 2, 3]);
        });

        it("suggestion list removal", function () {
            expect(auto.getSelectedValue(1)).toEqual(['peach']);
            auto.removeSuggestion(1);
            expect(auto.suggestionList.entries()).toEqual([0, 2, 3]);
            expect(auto.getSelectedValue(1)).toEqual(['pear']);
        });

        it("suggestion list remove and adding back", function () {
            expect(auto.removeSuggestion(1)).toEqual([1, ['peach']]);
            expect(auto.removeSuggestion(2)).toEqual([3, ['grape']]);
            expect(auto.suggestionList.entries()).toEqual([0, 2]);
            auto.addSuggestion(3);
            expect(auto.suggestionList.entries()).toEqual([0, 2, 3]);
        });

        it("check values in suggestions list", function () {
            expect(auto.activeSuggestions()).toEqual([ ['banana'], ['peach'], ['pear'], ['grape'] ]);
            auto.removeSuggestion(2);
            expect(auto.suggestionList.entries()).toEqual([0, 1, 3]);
            expect(auto.activeSuggestions()).toEqual([ ['banana'], ['peach'], ['grape'] ]);
        });

        function checkSelect(expectedIndex, expectedValue) {
            auto.select(expectedIndex);
            expect(auto.el.value).toEqual(expectedValue);
            expect(auto.onSelect).toHaveBeenCalledWith(expectedIndex);
        }
    });
});