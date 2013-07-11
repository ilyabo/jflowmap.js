var w = 900, h = 550;

var m = { t: 15, r: 15, b: 15, l: 15 };

var svg = d3.select('body').append('svg').attr({ width: w,  height: h });


var vis = svg.append('g')
  .attr('transform', 'translate(' + m.l + ', ' + m.t + ')');


var map = vis.append('g').attr('class', 'map');

var projection = d3.geo.albers().rotate([0, 0]).center([8.8, 46.8]).scale(14000);

var geoPath = d3.geo.path().projection(projection);

queue()
  .defer(d3.json, 'data/swiss-cantons-simplified.json')
  .await(function(err, mapData, flowData) {
    var geometries, mapShapes;

    geometries = topojson.object(mapData, mapData.objects['swiss-cantons']).geometries;



    var rnd = Math.random; //d3.random.normal(50, 20);

    geometries.forEach(function(d) {
      d.values = d3.range(3).map(function(d) {
        return {
          key: d,
          value: rnd()
        };
      });
    });

    var layout = function(data) {
      data.forEach(function(d) {
        var sum = d.values.reduce(function(sum,d) { return d.value+sum; }, 0);
        var i, w, offset = 0;
        for (i = 0; i < d.values.length; i++) {
          var v = d.values[i].value;
          d.values[i].offset = offset;
          w = v/sum;
          d.values[i].width = w;
          offset += w;
        }
      });
      return data;
    };


    mapShapes = map.selectAll('g.path')
      .data(layout(geometries))
    .enter().append('g')
      .attr('class', 'path');

    patternsEnter = mapShapes.append('pattern')
      .attr('id', function(d, i) { return 'multi-fill_' + i; })
      .attr('class', 'multi-fill')
      .attr('patternTransform', 'rotate(45),scale(25)')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 1)
      .attr('height', 1);

    var fillColors = ['#78D853', '#3E3537', '#CB6E34'].reverse();
//    var fillColors = d3.scale.category10();

    patternsEnter.selectAll('pattern')
      .data(function(d) { return d.values; })
    .enter()
      .append('rect')
        .attr('fill', function(d, i) { return fillColors[i]; })
        .attr('x', function(d) { return d.offset; })
        .attr('y', 0)
        .attr('width', function(d) { return d.width; })
        .attr('height', 1);



    mapShapes.append('path')
      .attr('d', geoPath)
      .attr('fill', function(d, i) { return 'url(#multi-fill_' + i + ')'; });

  });


