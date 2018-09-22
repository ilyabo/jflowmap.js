
var w = window.innerWidth,
  h = window.innerHeight;




var svg = d3.select("body").append("svg")
  .attr("width", w)
  .attr("height", h);



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

var projection = d3.geo.albers()
  .rotate([0, 0])
  .center([9.6, 46.6])
  .scale(10300);
var geoPath = d3.geo.path()
  .projection(projection)



d3.tsv('data/ch-migration-2011.tsv', function(data) {
d3.json('data/swiss-cantons-simplified.json', function(cantons) {

//  console.log(cantons)

  var geoms = topojson.object(cantons, cantons.objects["swiss-cantons"]).geometries;
  var centroidByCode = d3.nest()
    .key(function(d) { return d.properties.abbr; })
    .rollup(function(dd ) { return geoPath.centroid(dd[0])}  )
    .map(geoms);

  //console.log(byCode)

  var matrix = d3.nest()
    .key(function(d) { return d.origin; })
    .rollup(function(dd) {
      delete dd[0].origin;
      delete dd[0].CH;
      return dd[0]; })
    .map(data);


  odMatrix(
    d3.keys(data[0]).sort(function(a, b) { return d3.ascending(centroidByCode[a][1], centroidByCode[b][1])}),
    d3.keys(data[0]).sort(function(a, b) { return d3.ascending(centroidByCode[a][0], centroidByCode[b][0])}),
    matrix);


});
});


function odMatrixOfNumbers(odMatrix) {
  var matrix = [];
  var values = [];


  var nodeList = d3.keys(odMatrix);
  for (var oi = 0; oi < nodeList.length; oi++) {
    matrix[oi] = [];
    for (var di = 0; di < nodeList.length; di++) {
      matrix[oi][di] = +odMatrix[nodeList[oi]][nodeList[di]] || 0;
    }
  }

//  console.log(JSON.stringify(nodeList))
  // console.log(JSON.stringify(matrix))
  return matrix;
}



function odMatrix(rowKeys, colKeys, matrix) {


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
//  var matrixOfNums = odMatrixOfNumbers(matrix);
//  console.log(matrixOfNums)
//  var clustered = clusterer(matrixOfNums);
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
    .data(rowKeys)

  svg.selectAll("text.dest")
    .data(colKeys)
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
      .data(colKeys)
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


