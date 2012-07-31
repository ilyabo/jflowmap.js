winkelTripel = function() {
      var cos_phi1, dx, dy, phi1, proj, radians, scale, sinc;
      dx = 0;
      dy = 0;
      scale = 1.0;
      phi1 = Math.acos(2 / Math.PI);
      cos_phi1 = Math.cos(phi1);
      sinc = function(x) {
        return Math.sin(x) / x;
      };
      radians = function(degrees) {
        return degrees * Math.PI / 180;
      };
      proj = function(coords) {
        var alpha, c, cos_lpphi, lplam, lpphi, sinc_alpha, x, y;
        lplam = radians(coords[0]);
        lpphi = radians(coords[1]);
        c = 0.5 * lplam;
        cos_lpphi = Math.cos(lpphi);
        alpha = Math.acos(cos_lpphi * Math.cos(c));
        if (alpha !== 0) {
          sinc_alpha = sinc(alpha);
          x = 2.0 * cos_lpphi * Math.sin(c) / sinc_alpha;
          y = Math.sin(lpphi) / sinc_alpha;
        } else {
          x = y = 0.0;
        }
        x = (x + lplam * cos_phi1) * 0.5;
        y = (y + lpphi) * 0.5;
        y = -y;
        return [x * scale + dx, y * scale + dy];
      };
      proj.scale = function(x) {
        if (!arguments.length) {
          return scale;
        } else {
          scale = +x;
          return proj;
        }
      };
      proj.translate = function(x) {
        if (!arguments.length) {
          return [dx, dy];
        } else {
          dx = +x[0];
          dy = +x[1];
          return proj;
        }
      };
      return proj;
    };