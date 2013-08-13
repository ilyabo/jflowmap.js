
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

d3.tsv('data/ch-migration-2011.tsv', function(data) {

  var matrix = d3.nest()
    .key(function(d) { return d.origin; })
    .rollup(function(dd) {
      delete dd[0].origin;
      delete dd[0].CH;
      return dd[0]; })
    .map(data);


  odMatrix(d3.keys(data[0]), matrix);


});


function odMatrixOfNumbers(odMatrix) {
  var matrix = [];
  var values = [];


  var nodeList = d3.keys(odMatrix);
  for (var oi = 0; oi < nodeList.length; oi++) {
    matrix[oi] = [];
    for (var di = 0; di < nodeList.length; di++) {
      matrix[oi][di] = odMatrix[nodeList[oi]][nodeList[di]] || 0;
    }
  }

//  console.log(JSON.stringify(nodeList))
  // console.log(JSON.stringify(matrix))
  return matrix;
}



function odMatrix(keys, matrix) {


//  var matrix = [];
//  var values = [ 0 ];
//
//  for (var fi in flows) {
//    var f = flows[fi]
//    var v = +f[year];
//    var o = nodeDataByCode[f.Origin].Name;
//    var d = nodeDataByCode[f.Dest].Name;
//    if (o && d && !isNaN(v)) {
//      if (!matrix[o]) matrix[o] = {};
//      matrix[o][d] = v;
//      values.push(v);
//    }
//  }


//  console.log(matrix)

//  var clusterer = science.stats.hcluster();
//  var clustered = clusterer(odMatrixOfNumbers(matrix));
//  console.log(clustered)

  var color = d3.scale.sqrt()
    .range(["#FEE0D2", d3.hcl("#DE2D26").darker(2).toString() ])
    .domain([1, 62000])
    .interpolate(d3.interpolateHcl);


//  var keys = d3.keys(nodes);
//  keys.sort();

//  console.log(keys)
  // console.log("values: " + values.length + " keys:" + keys.length);
  // console.log(color.domain())



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
        .attr("y", -2)
        .attr("text-anchor", "middle")
        .attr("x", function(d,i) { return rectsize/2 + i * rectsize;})
//        .attr("transform", function(d,i) { return "rotate(-45, "+(i*rectsize)+",-1)";})
        .text(function(d) { return d; })

  row.enter()
    .append("g")
      .attr("class", "row")
      .attr("transform", function(d,i) {return "translate(0, "+ (i*rectsize)+")"})
    .append("text")
      .attr("y", 7)
      .attr("x", -2)
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
              return "#aaa"
        })
        
      .append("title")
        .text( function(d, i) { 
          var orig = this.parentNode.parentNode.__data__;
          var dest = d;
          var v = (matrix[orig] !== undefined ? (matrix[orig][dest] !== undefined ? matrix[orig][dest] : 0) : 0);
          return orig +"->"+dest + ": " + v; 
        })


}


