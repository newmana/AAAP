describe("autocomplete", function () {

    beforeEach(function () {
        setFixtures('<input type="text" name="wunderbar" id="query"/><div id="container"/>');
        auto = new Autocomplete("query", {
            serviceUrl : "/object",
            container : "container"
        });
        auto.isDomLoaded = true;
        auto.initialize();
    });

    describe("check suggest", function () {
        beforeEach(function () {
            auto.currentValue = 'a';
            auto.suggestions = [
                ['banana'],
                ['peach']
            ];
            auto.data = [ 'fruit_1', 'fruit_2'];
            auto.suggest();
        });

        it("valid suggestions causes update to DOM", function () {
            expect(auto.enabled).toBe(true);
            expect($('container')).toContain('div[title=banana]');
            expect($('container')).toContain('div[title=peach]');
        });

        it("move up at the top can go no further, and move down two then up", function () {
            checkMoveUp(-1, "");
            checkMoveDown(0, "banana");
            checkMoveDown(1, "peach");
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
            auto.suggestions = [
                ['banana'],
                ['peach'],
                ['pear'],
                ['grape']
            ];
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

        it("suggestion list generation", function() {
            expect(auto.suggestionList).toEqual([0,1,2,3]);
        });

        it("suggestion list removal", function() {
            expect(auto.getSelectedValue(1)).toEqual(['peach']);
            auto.removeSuggestion(1);
            expect(auto.suggestionList.entries()).toEqual([0,2,3]);
            expect(auto.getSelectedValue(1)).toEqual(['pear']);
        });

        it("suggestion list remove and adding back", function() {
            expect(auto.removeSuggestion(1)).toEqual([1, ['peach']]);
            expect(auto.removeSuggestion(2)).toEqual([3, ['grape']]);
            auto.addSuggestion(3, ['grape']);
        });

        function checkSelect(expectedIndex, expectedValue) {
            auto.select(expectedIndex);
            expect(auto.el.value).toEqual(expectedValue);
            expect(auto.onSelect).toHaveBeenCalledWith(expectedIndex);
        }
    });
});