
// TODO: add a filiter with a histogram:
//   the bins are flow magnitudes
//   the y axis shows the total magnitude per bin (not the count)


var year = '2006';
var minMagnitude = 50000; //100000;
var useGreatCircles = false;
var minPathWidth = 1, maxPathWidth = 30;
var centroidRadius = 1.5;
var useHalfFlowLines = false;



if (/^\?\d{4}$/.exec(window.location.search) !== null) {
  year = window.location.search.substr(1);
}

var w = window.innerWidth,
  h = window.innerHeight;


d3.loadData = function() {
  var loadedCallback = null;
  var toload = {};
  var data = {};
  var loaded = function(name, d) {
    delete toload[name];
    data[name] = d;
    return notifyIfAll();
  };
  var notifyIfAll = function() {
    if ((loadedCallback != null) && d3.keys(toload).length === 0) {
      loadedCallback(data);
    }
  };
  var loader = {
    json: function(name, url) {
      toload[name] = url;
      d3.json(url, function(d) {
        return loaded(name, d);
      });
      return loader;
    },
    csv: function(name, url) {
      toload[name] = url;
      d3.csv(url, function(d) {
        return loaded(name, d);
      });
      return loader;
    },
    onload: function(callback) {
      loadedCallback = callback;
      notifyIfAll();
    }
  };
  return loader;
};


var projection =
  //d3.geo.winkel3();
  //d3.geo.conicEquidistant();
  d3.geo.briesemeister().rotate([-10, -45]);
  //d3.geo.mercator();
  //d3.geo.equirectangular();



var path = d3.geo.path()
  .projection(projection);

var arc = d3.geo.greatArc().precision(3) //3);



var svg = d3.select("body").append("svg")
  .attr("width", w)
  .attr("height", h);


var defs = svg.append("svg:defs");

svg = svg.append("g");
//.attr("transform", "translate(" + margin.left + "," + margin.top + ")");




svg.append("svg:rect")
  .attr("width", w)
  .attr("height", h)
  .attr("class", "background")
;


var countries = svg.append("g").attr("class", "countries");
var arcs = svg.append("g").attr("class", "arcs");
var centroids = svg.append("g").attr("class", "centroids");


svg.append("text")
  .attr("id", "loading")
  .attr("x", 5)
  .attr("y", 17)
  .attr("font-size", "9pt")
  .attr("font-family", "arial")
  //.text("Loading year "+year+"...");


  var nodeDataByCode = {};

d3.loadData()
  .json('countries', 'data/world-countries.json')
  .csv('nodes', 'data/refugee-nodes.csv')
  .csv('flows', 'data/refugee-flows.csv')
  .onload(function(data) {

    data.nodes.forEach(function(node) {
      nodeDataByCode[node.Code] = node;
    });

    var flows = data.flows
      .filter(function(d) { return d.Origin != d.Dest; }) // TODO: special graph for self-loops

    var largeFlows = data.flows
      //.filter(function(d) { return !isNaN(d[year]) })
      .filter(function(d) { return d[year] > minMagnitude });

    var nodes = {};
    for (var fi in largeFlows) {
      var f = largeFlows[fi]
      var v = +f[year];
      if (f.Dest && f.Origin && !isNaN(v)) {
        nodes[nodeDataByCode[f.Dest].Name]=true;
        nodes[nodeDataByCode[f.Origin].Name]=true;
      }
    }

    odMatrix(nodes, flows);
    return;


});

function odMatrix(nodes, flows) {
  var matrix = [];
  var values = [ 0 ];

  for (var fi in flows) {
    var f = flows[fi]
    var v = +f[year];
    var o = nodeDataByCode[f.Origin].Name;
    var d = nodeDataByCode[f.Dest].Name;
    if (o && d && !isNaN(v)) {
      if (!matrix[o]) matrix[o] = {};
      matrix[o][d] = v;
      values.push(v);
    }
  }

  var color = d3.scale.linear()
    .range(["#FEE0D2", "#DE2D26"])
    .domain([1, d3.max(values)])
    .interpolate(d3.interpolateHcl);


  var keys = d3.keys(nodes);
  keys.sort();
  console.log("values: " + values.length + " keys:" + keys.length);
  console.log(color.domain())



  var svg = d3.select("body").select("svg").append("g")
    .attr("transform", "translate(70, 50)")
  var rectsize = 10;
  var row = svg.selectAll("g.row")
    .data(keys)

  svg.selectAll("text.dest")
    .data(keys)
    .enter()
      .append("text")
        .attr("class", "dest")
        .attr("y", -1)
        .attr("x", function(d,i) { return 4 + i * rectsize;})
        .attr("transform", function(d,i) { return "rotate(-45, "+(i*rectsize)+",-1)";})
        .text(function(d) { return d; })

  row.enter()
    .append("g")
      .attr("class", "row")
      .attr("transform", function(d,i) {return "translate(0, "+ (i*rectsize)+")"})
    .append("text")
      .attr("y", 8)
      .attr("x", -3)
      .attr("text-anchor", "end")
      .text(function(d) { return d; })
  
  row.selectAll("rect")
      .data(keys)
    .enter()
      .append("rect")
        .attr("x", function(d, i) { return rectsize * i; })
        .attr("width", rectsize)
        .attr("height", rectsize)
        .attr("fill", function(d, i) { 
            var orig = this.parentNode.__data__;
            var dest = d;
            var v = (matrix[orig] !== undefined ? (matrix[orig][dest] !== undefined ? matrix[orig][dest] : 0) : 0);
            if (v >= 1)
              return color(v); 
            else
              return "#999"
        })
        
      .append("title")
        .text( function(d, i) { 
          var orig = this.parentNode.parentNode.__data__;
          var dest = d;
          var v = (matrix[orig] !== undefined ? (matrix[orig][dest] !== undefined ? matrix[orig][dest] : 0) : 0);
          return orig +"->"+dest + ": " + v; 
        })


}


