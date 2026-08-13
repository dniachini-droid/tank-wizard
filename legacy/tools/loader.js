(function () {
  var msg = document.getElementById("bootmsg");
  var NL = String.fromCharCode(10);

  function say(t) { if (msg) msg.textContent = t; }

  function fail(title, detail) {
    var boot = document.getElementById("boot");
    if (!boot) return;
    boot.innerHTML = "";
    var h = document.createElement("div");
    h.style.color = "#C4285B";
    h.textContent = "Could not start";
    boot.appendChild(h);
    var d = document.createElement("div");
    d.className = "err";
    var extra = "";
    if (detail) extra = NL + NL + (detail.stack || detail.message || String(detail));
    d.textContent = title + extra;
    boot.appendChild(d);
  }

  var stage = "startup";

  window.addEventListener("error", function (ev) {
    var bare = !ev.error && (!ev.message || ev.message.indexOf("Script error") === 0);
    if (bare) return;
    if (document.getElementById("boot")) fail("Error during " + stage, ev.error || ev.message);
  });

  var LIBS = [
    { global: "React", urls: [
      "https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js",
      "https://unpkg.com/react@18.3.1/umd/react.production.min.js",
      "https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js" ] },
    { global: "ReactDOM", urls: [
      "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js",
      "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js",
      "https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js" ] },
    { global: "PropTypes", optional: true, urls: [
      "https://cdnjs.cloudflare.com/ajax/libs/prop-types/15.8.1/prop-types.min.js",
      "https://unpkg.com/prop-types@15.8.1/prop-types.min.js" ] },
    { global: "Recharts", urls: [
      "https://cdnjs.cloudflare.com/ajax/libs/recharts/2.12.7/Recharts.min.js",
      "https://unpkg.com/recharts@2.12.7/umd/Recharts.min.js",
      "https://cdn.jsdelivr.net/npm/recharts@2.12.7/umd/Recharts.min.js" ] },
    { global: "Babel", urls: [
      "https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.7/babel.min.js",
      "https://unpkg.com/@babel/standalone@7.24.7/babel.min.js",
      "https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.7/babel.min.js" ] }
  ];

  function loadOne(urls, i, done) {
    if (i >= urls.length) { done(false); return; }
    var el = document.createElement("script");
    var settled = false;
    var timer = setTimeout(function () {
      if (settled) return;
      settled = true;
      loadOne(urls, i + 1, done);
    }, 9000);
    function finish(ok) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (ok) { done(true); } else { loadOne(urls, i + 1, done); }
    }
    el.src = urls[i];
    el.onload = function () { finish(true); };
    el.onerror = function () { finish(false); };
    document.head.appendChild(el);
  }

  function loadAll(idx) {
    if (idx >= LIBS.length) { start(); return; }
    var lib = LIBS[idx];
    if (window[lib.global]) { loadAll(idx + 1); return; }
    stage = "loading " + lib.global;
    say("Loading " + lib.global + "...");
    loadOne(lib.urls, 0, function (ok) {
      if (!ok && !lib.optional) {
        fail("Could not load " + lib.global + " from any CDN." + NL +
             "Check the connection, then reload.");
        return;
      }
      loadAll(idx + 1);
    });
  }

  function start() {
    var missing = [];
    for (var i = 0; i < LIBS.length; i++) {
      if (!LIBS[i].optional && !window[LIBS[i].global]) missing.push(LIBS[i].global);
    }
    if (missing.length) {
      fail("These libraries did not load: " + missing.join(", "));
      return;
    }
    try {
      stage = "compiling";
      say("Compiling...");
      var src = document.getElementById("app-src").textContent;
      var out = Babel.transform(src, { presets: ["react"] }).code;
      stage = "running";
      say("Starting...");
      (0, eval)(out);
    } catch (e) {
      fail("Failed while starting the app", e);
    }
  }

  loadAll(0);
})();
