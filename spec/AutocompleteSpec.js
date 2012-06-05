describe("autocomplete", function () {

    beforeEach(function () {
        setFixtures('<input type="text" name="wunderbar" id="query"/><div id="container"/>');
        auto = new Autocomplete("query", {
            serviceUrl : "/object",
            container : "container"
        });
        auto.isDomLoaded = true;
        auto.initialize();
        response = {query : 'a', suggestions : [
            ['banana'],
            ['peach'],
            ['pear'],
            ['grape']
        ], data : [ 'fruit_1', 'fruit_2', 'fruit_3', 'fruit_4']};
        auto.currentValue = 'a';
        auto.list = new AutocompleteList();
        auto.list.setWithResponse(response);
        auto.suggest();
    });

    describe("check suggest", function () {
        it("valid suggestions causes update to DOM", function () {
            expect(auto.enabled).toBe(true);
            expect($('container')).toContain('div[title=banana]');
            expect($('container')).toContain('div[title=peach]');
        });

        it("check that the length of the active suggestions equals the suggest list key size", function () {
            expect(auto.list.activeSuggestions().length).toEqual(auto.list.suggestionList.entries().length);
            var suggestion = auto.list.removeSuggestion(0);
            expect(auto.list.activeSuggestions().length).toEqual(auto.list.suggestionList.entries().length);
            auto.list.addSuggestion(suggestion[0]);
            expect(auto.list.activeSuggestions().length).toEqual(auto.list.suggestionList.entries().length);
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
            auto.list.removeSuggestion(1);
            auto.list.removeSuggestion(1);
            auto.list.removeSuggestion(1);
            checkMoveDown(0, "banana");
            checkMoveDown(0, "banana");
        });

        it("check moving with removal", function () {
            checkMoveUp(-1, "");
            checkMoveDown(0, "banana");
            checkMoveDown(1, "peach");
            checkMoveDown(2, "pear");
            var suggestion = auto.list.removeSuggestion(1);
            expect(suggestion[1]).toEqual(["peach"]);
            checkMoveUp(0, "banana");
            checkMoveUp(-1, "a");
        });

        function checkMoveUp(expectedIndex, expectedValue) {
            auto.moveUp();
            expect(auto.list.selectedIndex).toEqual(expectedIndex);
            expect(auto.el.value).toEqual(expectedValue);
        }

        function checkMoveDown(expectedIndex, expectedValue) {
            auto.moveDown();
            expect(auto.list.selectedIndex).toEqual(expectedIndex);
            expect(auto.el.value).toEqual(expectedValue);
        }
    });

    describe("check select", function () {
        it("test onSelect", function () {
            auto.options.onSelect = function (origIndex, selectedIndexAndValue) {
                expect(origIndex).toEqual(1);
                expect(selectedIndexAndValue[0]).toEqual("peach");
            };
            auto.select(1);
        });

        it("test onSelect with remove", function () {
            auto.options.onSelect = function (origIndex, selectedIndexAndValue) {
                expect(origIndex).toEqual(1);
                expect(selectedIndexAndValue[0]).toEqual("pear");
            };
            auto.list.removeSuggestion(1);
            auto.select(1);
            expect(auto.list.selectedIndex).toEqual(-1);
        });

        it("suggestion list generation", function () {
            expect(auto.list.suggestionList).toEqual([0, 1, 2, 3]);
        });

        it("suggestion list removal", function () {
            expect(auto.list.getEntryIndex(1)).toEqual([1, ['peach']]);
            auto.list.removeSuggestion(1);
            expect(auto.list.suggestionList.entries()).toEqual([0, 2, 3]);
            expect(auto.list.getEntryIndex(1)).toEqual([2, ['pear']]);
        });

        it("suggestion list remove and adding back", function () {
            expect(auto.list.removeSuggestion(1)).toEqual([1, ['peach']]);
            expect(auto.list.removeSuggestion(2)).toEqual([3, ['grape']]);
            expect(auto.list.suggestionList.entries()).toEqual([0, 2]);
            auto.list.addSuggestion(3);
            expect(auto.list.suggestionList.entries()).toEqual([0, 2, 3]);
        });

        it("check values in suggestions list", function () {
            expect(auto.list.activeSuggestions()).toEqual([ ['banana'], ['peach'], ['pear'], ['grape'] ]);
            auto.list.removeSuggestion(2);
            expect(auto.list.suggestionList.entries()).toEqual([0, 1, 3]);
            expect(auto.list.activeSuggestions()).toEqual([ ['banana'], ['peach'], ['grape'] ]);
        });
    });
});