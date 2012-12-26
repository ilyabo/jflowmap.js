
// TODO: add a filiter with a histogram:
//   the bins are flow magnitudes
//   the y axis shows the total magnitude per bin (not the count)


var year = '2006';
var minMagnitude = 10000;
var useGreatCircles = false;
var minPathWidth = 1, maxPathWidth = 40;



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
  .text("Loading year "+year+"...");


d3.loadData()
  .json('countries', 'data/world-countries.json')
  .csv('nodes', 'data/refugee-nodes.csv')
  .csv('flows', 'data/refugee-flows.csv')
  .onload(function(data) {

    data.flows = data.flows
      //.filter(function(d) { return !isNaN(d[year]) })
      .filter(function(d) { return d.Origin != d.Dest; }) // TODO: special graph for self-loops
      .filter(function(d) { return d[year] > minMagnitude });



    fitProjection(projection, data.countries, [[0,0],[w, h]], true);

    d3.select("#loading").attr("visibility", "hidden");

    var nodeDataByCode = {}, links = [];
    var maxMagnitude =
      d3.max(data.flows, function(d) { return parseFloat(d[year])});


    var magnitudeFormat = d3.format(",.0f");

    var arcWidth = d3.scale.linear().domain([1, maxMagnitude]).range([minPathWidth, maxPathWidth]);
    var maxColor = 'rgb(8, 48, 107)';
    var minColor = d3.rgb('#f0f0f0').darker(0.5);
    //var minColor = d3.rgb(maxColor).brighter(3);

    var arcColor = d3.scale.log().domain([1, maxMagnitude]).range([minColor, maxColor]);
    var arcOpacity = d3.scale.log().domain([1, maxMagnitude]).range([1, 1]);





    // legend
    var legend = d3.select("#legend").append("svg")
      .attr("width", 100)
      .attr("height", 100);

    var legendValues = [ maxMagnitude ];

    legend.select("path")
      .data(legendValues)
      .enter()
      .append("path")
      .attr("d", function(d, i) {
        return taperedPath([[0,i*20], [50, i*20]], d.magnitude);
      });



    /*
     maxR = rscale.range()[1]  # rscale(pow10(maxOrd))
     legend = selection.select("svg.legend")

     maxOrd = Math.floor(log10(maxTotalMagnitude))
     values = []

     unless isNaN(maxTotalMagnitude)
     addValue = (v) ->
     values.push(v) if values.length is 0 or (rscale(values[values.length - 1]) - rscale(v)) > 6
     addValue maxTotalMagnitude
     addValue pow10(maxOrd) * 5
     addValue pow10(maxOrd)
     addValue pow10(maxOrd) / 2
     values.push(pow10(maxOrd - 1))
     */



    countries.selectAll("path")
      .data(data.countries.features)
      .enter().append("path")
      .attr("class", "land")
      .attr("d", path);


    var initialScale = projection.scale() / 1.1;
    projection.scale(initialScale);

    var zoom = d3.behavior.zoom()
      .translate(projection.translate())
      .scale(initialScale)
      .scaleExtent([initialScale, initialScale * 10])
      .on("zoom", updateOnZoom);
    svg.call(zoom);

    function updateOnZoom() {
      var t = d3.event.translate,
        s = d3.event.scale;
      t[0] = Math.max(-s / 2, Math.min(w + s / 2, t[0]));
      t[1] = Math.max(-s / 2, Math.min(h + s / 2, t[1]));
      zoom.translate(t);

      projection.translate(t).scale(s);

      updateNodeCoords();
      updatePositions();

    }


    function updateNodeCoords() {
      data.nodes.forEach(function(node) {
        node.coords = nodeCoords(node);
        node.projection = node.coords ? projection(node.coords) : undefined;
      });
    }


    function nodeCoords(node) {
      var lon = parseFloat(node.Lon), lat = parseFloat(node.Lat);
      if (isNaN(lon) || isNaN(lat)) return null;
      return [lon, lat];
    }


    data.nodes.forEach(function(node) {
      nodeDataByCode[node.Code] = node;
    });

    //data.flows = data.flows.filter(function(d) { return (d.Origin == 'IDN' && d.Dest == 'USA') ||  (d.Origin == 'LBR'  &&  d.Dest == 'NZL' );  });
    updateNodeCoords();

    data.flows.forEach(function(flow) {
      var o = nodeDataByCode[flow.Origin], co = o.coords; //, po = o.projection;
      var d = nodeDataByCode[flow.Dest], cd = d.coords; // pd = d.projection;
      var magnitude = parseFloat(flow[year]);
      if (co  &&  cd  &&  !isNaN(magnitude)) {
        links.push({
          source: co, target: cd,
          magnitude: magnitude,
          origin:o, dest:d
          // originp: po, destp:pd
        });
      }
    });

    function pointsFromPath(path) {
      var points = path.substr(path.lastIndexOf("M")).split("L");
      // TODO: FIX: If the path consists of several segments we currently use only the last one
      if (points.length < 2) return path;

      var coords = points.map(function(d, i) {
        if (d[0] == "M") d = d.substr(1);
        c = d.split(",")
        return [+c[0], +c[1]]; // remove M and split
      });
      return coords;
    }

    function taperedPath(coords, pathWidth) {
      var i, c;
      var there = [], back = [], p;

      for (i = 1; i < coords.length; i++) {
        c = coords[i];
        if (pathWidth > 0) {
          p = perpendicularSegment(c, coords[i-1], i * pathWidth / coords.length, c);
        } else {
          p = [c,c];
        }
        if (isNaN(p[0][0]))
          console.log(p)
        there.push(p[0].join(","));
        back.push(p[1].join(","));
      }

      if (pathWidth > 0) {
        p = perpendicularSegment(p[0], p[1], pathWidth/1.4, coords[coords.length - 1]);
        p = perpendicularSegment(p[0], p[1], pathWidth/2, p[1]);
      }

      return "M" + coords[0].join(",") + " L" +
        there.join(" L") +
        (pathWidth > 0 ?
          " C" + p[1].join(",") + " " + p[0].join(",") : " L"
          ) +
        " " + back.reverse().join(" L") +
        " L" + coords[0].join(",") +
        "Z";
    }

    // Returns the vertexes of a segment which has its middle in point p
    // and is perpendicular to the line which passes through points a,b.
    // see http://math.stackexchange.com/questions/175896
    function perpendicularSegment(a, b, length, p) {
      var v = [b[0] - a[0], b[1] - a[1]];
      var vnorm = Math.sqrt( v[0] * v[0] + v[1] * v[1] );
      var u = [v[0] / vnorm, v[1] / vnorm];

      u = [ -u[1], u[0] ];  // rotate by 90 degrees

      var d = [ u[0]*length/2, u[1]*length/2 ];

      return [
        [+p[0] + d[0], +p[1] + d[1] ],
        [+p[0] - d[0], +p[1] - d[1] ]
      ];
    }

    function updatePositions() {
      countries.selectAll("path").attr("d", path);

      centroids.selectAll("circle")
        .attr("cx", function(d) { return d.projection[0] } )
        .attr("cy", function(d) { return d.projection[1] } );

      arcs.selectAll("path")
        .attr("d", function(d) {
          return taperedPath(pointsFromPath(path({ "type": "LineString",
            "coordinates": [d.source, d.target]
          })), arcWidth(d.magnitude));
        });

    }


    var arcNodes = arcs.selectAll("path")
      .data(links)
      .enter().append("path")
      .attr("data-name", function(d) { return d.origin.Code + "?" + d.dest.Code; })
      .attr("data-magnitude", function(d) { return d.magnitude; })
      .attr("data-width", function(d) { return arcWidth(d.magnitude); })
      //.attr("stroke", gradientRefNameFun)
      //.attr("stroke-linecap", "round")
      //.attr("stroke-width", function(d) { return arcWidth(d.magnitude); })
      .sort(function(a, b) {
        var a = a.magnitude, b = b.magnitude;
        if (isNaN(a)) if (isNaN(b)) return 0; else return -1; if (isNaN(b)) return 1;
        return d3.ascending(a, b);
      });


    arcNodes.append("svg:title")
      .text(function(d) {
        return d.origin.Name+" -> "+d.dest.Name+"\n"+
          "Refugees in " +year+": " +magnitudeFormat(d.magnitude);
      })
    ;




    centroids.selectAll("circle")
      .data(data.nodes.filter(function(node) { return node.projection ? true : false }))
      .enter().append("circle")
      .attr("class", "centroid")
      .attr("r", 2.2)
      .append("svg:title")
      .text(function(d) {
        return d.Name;
      })

    ;

    updatePositions();




  });
