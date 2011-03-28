describe("autocomplete", function() {

  beforeEach(function() {
    setFixtures('<input type="text" name="wunderbar" id="query"/><div id="container"/>');
    auto = new Autocomplete("query", {
      serviceUrl : "/object",
      container : "container"
    });
    auto.isDomLoaded = true;
    auto.initialize();
  });

  it("valid suggestions causes update to DOM", function() {
    auto.currentValue = 'a';
    auto.suggestions = ['banana', 'peach'];
    auto.data = [ 'fruit_1', 'fruit_2'];
    auto.suggest();
    expect(auto.enabled).toBe(true);
    expect($('container')).toContain('div[title=banana]');
    expect($('container')).toContain('div[title=peach]');
  }); 
  
  it("selecting second suggestion", function() {
    auto.currentValue = 'a';
    auto.suggestions = ['banana', 'peach'];
    auto.data = [ 'fruit_1', 'fruit_2'];
    auto.suggest();
    checkMoveDown(0, "banana");
    checkMoveDown(1, "peach");
    checkMoveDown(1, "peach");
  });
  
  function checkMoveDown(expectedIndex, expectedValue) {
    auto.moveDown();
    expect(auto.selectedIndex).toEqual(expectedIndex);
    expect(auto.el.value).toEqual(expectedValue);
  }
});