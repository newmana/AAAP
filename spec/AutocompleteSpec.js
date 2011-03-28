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
    expect($('container')).toContain('#anonymous_element_1');;
    expect($('container')).toContain('#anonymous_element_2');;
    auto.currentValue = 'a';
    auto.suggestions = ['banana', 'peach'];
    auto.data = [ 'fruit_1', 'fruit_2'];
    auto.suggest();
    expect(auto.enabled).toBe(true);
    expect($('container')).toContain('div[title=banana]');
    expect($('container')).toContain('div[title=peach]');
  }); 
});