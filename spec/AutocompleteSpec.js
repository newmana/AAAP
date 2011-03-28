describe("autocomplete", function() {

  beforeEach(function() {
    setFixtures('<input type="text" name="wunderbar" id="query"/>');         
    auto = new Autocomplete("query", {});
  });

  it("can run", function() {
    expect(document.getElementById('query')).not.toBeNull();
  }); 
});