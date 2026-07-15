(function () {
  var canvas = document.getElementById('bg-particles');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, cx = 0, cy = 0, R = 0;
  var rotY = 0;
  var ROT_SPEED = 0.00055;

  var MERIDIANS = 8, LAT_STEPS = 15;
  var PARALLEL_PHIS = [-0.78, -0.26, 0.26, 0.78]; // radians, ~ -45,-15,15,45 deg
  var LON_STEPS = 28;

  var particles = [];
  var groups = {}; // groupKey -> ordered array of particle indices

  function rand(a, b) { return a + Math.random() * (b - a); }

  function project(theta0, phi) {
    var x0 = Math.cos(phi) * Math.cos(theta0);
    var y0 = Math.sin(phi);
    var z0 = Math.cos(phi) * Math.sin(theta0);
    var c = Math.cos(rotY), s = Math.sin(rotY);
    var x1 = x0 * c + z0 * s;
    var z1 = -x0 * s + z0 * c;
    var y1 = y0;
    return [cx + x1 * R, cy + y1 * R, z1];
  }

  function buildGlobe() {
    var minSide = Math.min(W, H);
    R = minSide * 0.44;
    cx = W / 2;
    cy = H / 2;
  }

  function initParticles() {
    particles = [];
    groups = {};

    function addGroup(key) { groups[key] = []; }
    function push(theta0, phi, groupKey) {
      var idx = particles.length;
      particles.push({
        x: rand(0, W), y: rand(0, H),
        vx: rand(-0.075, 0.075), vy: rand(-0.075, 0.075),
        r: rand(1.0, 2.3),
        phase: rand(0, Math.PI * 2),
        speed: rand(0.6, 1.4),
        gold: Math.random() < 0.42,
        theta0: theta0, phi: phi,
        group: groupKey
      });
      groups[groupKey].push(idx);
    }

    for (var m = 0; m < MERIDIANS; m++) {
      var key = 'm' + m;
      addGroup(key);
      var theta0 = (m / MERIDIANS) * Math.PI * 2;
      for (var s = 0; s < LAT_STEPS; s++) {
        var phi = -Math.PI / 2 + (s / (LAT_STEPS - 1)) * Math.PI;
        push(theta0, phi, key);
      }
    }
    for (var p = 0; p < PARALLEL_PHIS.length; p++) {
      var pkey = 'p' + p;
      addGroup(pkey);
      var phiFixed = PARALLEL_PHIS[p];
      for (var l = 0; l < LON_STEPS; l++) {
        var th = (l / LON_STEPS) * Math.PI * 2;
        push(th, phiFixed, pkey);
      }
    }
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildGlobe();
  }

  function scrollProgress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return 0;
    return Math.min(1, Math.max(0, window.scrollY / max));
  }

  var EDGE = 0.08;
  function attractionAmount(p) {
    var top = 1 - Math.min(1, p / EDGE);
    var bottom = 1 - Math.min(1, (1 - p) / EDGE);
    return Math.max(0, Math.min(1, Math.max(top, bottom)));
  }

  var t = 0;
  function frame() {
    t += 1;
    var pr = scrollProgress();
    var a = reduceMotion ? 0 : attractionAmount(pr);
    var pull = a * a * (3 - 2 * a);

    if (!reduceMotion) rotY += ROT_SPEED;

    ctx.clearRect(0, 0, W, H);

    if (pull > 0.05) {
      var glowR = R * 1.2;
      var grad = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, glowR);
      grad.addColorStop(0, 'rgba(212,175,55,' + (pull * 0.10).toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(212,175,55,0)');
      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();
    }

    var targets = null;
    if (pull > 0.001) {
      targets = new Array(particles.length);
      for (var i = 0; i < particles.length; i++) {
        var pt = particles[i];
        targets[i] = project(pt.theta0, pt.phi);
      }
    }

    for (var j = 0; j < particles.length; j++) {
      var p2 = particles[j];
      p2.x += p2.vx;
      p2.y += p2.vy;
      if (p2.x < -10) p2.x = W + 10;
      if (p2.x > W + 10) p2.x = -10;
      if (p2.y < -10) p2.y = H + 10;
      if (p2.y > H + 10) p2.y = -10;

      var drawX = p2.x, drawY = p2.y, depth = 0;
      if (pull > 0.001) {
        var tgt = targets[j];
        depth = (tgt[2] + 1) / 2; // 0 = far side, 1 = near side
        drawX = p2.x + (tgt[0] - p2.x) * pull;
        drawY = p2.y + (tgt[1] - p2.y) * pull;
        p2.x += (tgt[0] - p2.x) * pull * 0.025;
        p2.y += (tgt[1] - p2.y) * pull * 0.025;
      }

      var twinkle = 0.35 + 0.35 * Math.sin(t * 0.02 * p2.speed + p2.phase);
      var depthDim = 1 - pull * (1 - (0.25 + depth * 0.9));
      var alpha = (0.12 + twinkle * 0.45) * (0.55 + pull * 0.45) * depthDim;
      var rad = (p2.r + pull * 0.3) * (1 - pull * (1 - (0.4 + depth * 0.8)));

      ctx.beginPath();
      ctx.arc(drawX, drawY, Math.max(0.4, rad), 0, Math.PI * 2);
      ctx.fillStyle = p2.gold
        ? 'rgba(212,175,55,' + Math.max(0, alpha).toFixed(3) + ')'
        : 'rgba(245,246,248,' + Math.max(0, alpha * 0.85).toFixed(3) + ')';
      ctx.fill();
    }

    if (pull > 0.1 && targets) {
      for (var key in groups) {
        var idxs = groups[key];
        var closed = key.charAt(0) === 'p'; // parallels are closed loops, meridians are open arcs
        ctx.lineWidth = 1;
        for (var k = 0; k < idxs.length - 1; k++) {
          var ta = targets[idxs[k]], tb = targets[idxs[k + 1]];
          var avgDepth = ((ta[2] + 1) / 2 + (tb[2] + 1) / 2) / 2;
          var lineAlpha = pull * 0.32 * (0.15 + avgDepth * 0.9);
          ctx.strokeStyle = 'rgba(212,175,55,' + Math.max(0, lineAlpha).toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(ta[0], ta[1]);
          ctx.lineTo(tb[0], tb[1]);
          ctx.stroke();
        }
        if (closed && idxs.length > 2) {
          var t0 = targets[idxs[0]], tN = targets[idxs[idxs.length - 1]];
          var avgDepth2 = ((t0[2] + 1) / 2 + (tN[2] + 1) / 2) / 2;
          var lineAlpha2 = pull * 0.32 * (0.15 + avgDepth2 * 0.9);
          ctx.strokeStyle = 'rgba(212,175,55,' + Math.max(0, lineAlpha2).toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(tN[0], tN[1]);
          ctx.lineTo(t0[0], t0[1]);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(frame);
  }

  resize();
  initParticles();
  window.addEventListener('resize', function () { resize(); }, { passive: true });
  requestAnimationFrame(frame);
})();
