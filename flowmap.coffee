#rnd = -> Math.round(Math.random()*100)
rnd = d3.random.normal(30, 70)

w = 640
h = 480

m =
  t : 15
  r : 15
  b : 15
  l : 15

m.w = m.l + m.r
m.h = m.t + m.b




svg = d3.select("body").append("svg")
  .attr
    width : w
    height : h

#
#svg.append("defs")
#  .append("marker")
#    .attr(
#      id : "head"
#      orient : "auto"
#      markerUnits : "userSpaceOnUse"
#      markerWidth : 30
#      markerHeight : 30
#      refX : 25
#      refY : 15
#    )
#  .append("path")
#    .attr
#      d : "M0,0 V30 L15,15 Z"

vis = svg.append("g")
  .attr
    transform : "translate(#{m.l}, #{m.t})"


fg = svg.append("rect")
  .attr
    width : w
    height : h
    stroke : "#000"
    fill : "#fff"
    "fill-opacity" : 0

map = vis.append("g")
  .attr("class", "map")



mscale = d3.scale.linear()
  .range([0, 10])
  .domain([0, 100])








# Returns the vertexes of a segment which has its middle in point p
# and is perpendicular to the line which passes through points a,b.
# see http://math.stackexchange.com/questions/175896
perpendicularSegment = (a, b, length, p) ->
  v = [b[0] - a[0], b[1] - a[1]]
  vnorm = Math.sqrt(v[0] * v[0] + v[1] * v[1])
  u = [v[0] / vnorm, v[1] / vnorm]
  u = [-u[1], u[0]] # rotate by 90 degrees
  d = [u[0] * length / 2, u[1] * length / 2]
  [[+p[0] + d[0], +p[1] + d[1]], [+p[0] - d[0], +p[1] - d[1]]]





projection = d3.geo.albers()
  .rotate([0, 0])
  .center([9.6, 46.6])
  .scale(10300);

geoPath = d3.geo.path()
  .projection(projection)




#bumpLayer = (n) ->
#
#  bump = (a) ->
#    x = 1 / (.1 + Math.random())
#    y = 2 * Math.random() - .5
#    z = 10 / (.1 + Math.random())
#    i = 0
#
#    while i < n
#      w = (i / n - y) * z
#      a[i] += x * Math.exp(-w * w)
#      i++
#
#  a = []
#  i = undefined
#  i = 0
#  while i < n
#    a[i] = 0
#    ++i
#  i = 0
#  while i < 5
#    bump a
#    ++i
#
#  bumps = a.map (d, i) -> Math.max(0, d)
#  max = d3.max(bumps)
#  bumps.map (d) -> d/max
#
#
#console.log(bumpLayer(20).map (d) -> Math.round(d*100))



queue()
  .defer(d3.json, "data/swiss-cantons-simplified.json")
  .defer(d3.json, "data/flows.json")
  .await (err, mapData, flowData) ->


    geometries = topojson.object(mapData, mapData.objects["swiss-cantons"]).geometries



    mapShapes = map.selectAll("path")
      .data(geometries)

    mapShapes.enter().append('path')
      .attr
        d : geoPath
        opacity : 0.01


    diff = (a, b) -> [a[0] - b[0], a[1] - b[1]]
    norm = (v) -> Math.sqrt( v[0]*v[0] + v[1]*v[1] )

    data = do ->

      ndata = geometries.map (d) ->
        centroid = projection(d3.geo.centroid(d))
        name : d.properties.abbr
        c : centroid

  #    ndata = ndata.filter -> Math.random() < 0.5

#      fdata = []
#      for origin in ndata
#        for dest in ndata
#          if origin isnt dest
#
#            len = norm(diff(origin.c, dest.c))
#            m = rnd()
#
#            if (70 < len < 120)  and  (30 < m < 100)  #and  (Math.random() < 0.5)
#              fdata.push
#                origin : origin
#                dest : dest
#                magnitude : m

      nodes : ndata
      flows : flowData



  #  console.log JSON.stringify( data.flows )









    flowLine = do ->
      gap = 0.5

      arrowLength = 2   # proportion of thickness
      arrowWingSize = 1  # proportion of width


      # Returns the point on the line between points a and b
      # the dist of which from point b is distFromB
      pointBetween = (a, b, distFromB) ->

        d = diff(a, b)
        len = norm(d)

  #      distFromB = alpha * len

        normalized = [ d[0]/len, d[1]/len ]

        [ b[0] + distFromB * normalized[0], b[1] + distFromB * normalized[1] ]


      (origin, dest, thickness, shortenOriginBy = 6, shortenDestBy = 6) ->

        [a, b] = [origin, dest]

        b = pointBetween(a, b, shortenDestBy)
        a = pointBetween(b, a, shortenOriginBy)

        p0 = perpendicularSegment(a, b, gap*2, a)[1]
        p1 = perpendicularSegment(a, b, (gap + thickness)*2, a)[1]
        p_ = perpendicularSegment(a, b, (gap + thickness)*2, b)[1]
        p2 = pointBetween(p1, p_, arrowLength * thickness) # norm(diff(p1, p_)))
        p3 = perpendicularSegment(p1, p_, thickness*2 * arrowWingSize, p2)[1]

        p4 = perpendicularSegment(a, b, gap*2, b)[1]

        """M #{p0[0]},#{p0[1]}
           L #{p1[0]},#{p1[1]}
           L #{p2[0]},#{p2[1]}
           L #{p3[0]},#{p3[1]}
           L #{p4[0]},#{p4[1]} Z """




    flows = vis.selectAll("path.flow")
      .data(data.flows)
    #  .data([data.flows[0]])
        .enter()
      .append("svg:path")
        .attr
          class : "flow"
          opacity : 0.01
  #        "stroke-width" : (d) -> mscale(d.magnitude)
  #        "marker-end" : 'url(#head)'
          d : (d) ->
            flowLine(d.origin.c, d.dest.c, mscale(d.magnitude))

  #          "M #{d.origin.x},#{d.origin.y} " +
  #          "L #{d.dest.x},#{d.dest.y} "




    flows.append("svg:title")
      .text (d) -> d.origin.name + "->" + d.dest.name + ": " +  d.magnitude

    vis.selectAll("path.flow")
      .sort (a, b) -> d3.ascending(a.magnitude, b.magnitude)


    nodes = vis.selectAll("g.node")
      .data(data.nodes)
        .enter()
      .append("svg:g")
        .attr
          class : "node"
          opacity : 0.01
          transform : (d) -> "translate(#{d.c[0]},#{d.c[1]})"

    nodes.append("svg:circle")
      .attr
        cx : 0
        cy : 0
        r : 4


    nodes.append("svg:text")
      .text((d) -> d.name)



    duration = 500




    vis.selectAll("g.node")
      .transition()
        .duration(duration)
          .attr("opacity", 1)



    map.selectAll("path")
      .transition()
        .duration(duration)
          .attr("opacity", 0.5)



    vis.selectAll("path.flow")
      .transition()
        .duration(duration)
          .attr("opacity", 1)



