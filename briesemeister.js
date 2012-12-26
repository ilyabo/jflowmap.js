(function() {
  var briesemeister = (function() {
    var R = 1;
    var q = Math.sqrt(1.75);
    return function(λ, φ) {
      var D = 2/(1 + Math.cos(φ) * Math.cos(λ/2));
      var x = R * Math.sqrt(3.5 * D) * Math.cos(φ) * Math.sin(λ/2);
      var y = R * Math.sqrt(2 * D) * Math.sin(φ) / q;
      return [x, y];
    }
  })();


  briesemeister.invert = function(x, y) {
    // TODO
    return d3.geo.hammer.raw.invert(x, y);
  };

  d3.geo.briesemeister = function() {
    return d3.geo.projection(briesemeister);
  };
})();