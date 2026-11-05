/* BALI 2027 · True Google Static Maps / Street View previews (no key in public repository).
   API key is browser-local, images are fetched directly from Google when visible.
   Interactive embeds continue to load only after a click. */
(function () {
  "use strict";
  var KEY = "bali_google_static_key_v1";
  var apiKey = "";
  try { apiKey = localStorage.getItem(KEY) || ""; } catch (_) {}
  var observer, pending = false;
  function validKey(k) { return /^AIza[0-9A-Za-z_-]{30,}$/.test(k); }
  function urlParams(value) {
    try { return new URL(String(value).replace(/&amp;/g, "&"), location.href); }
    catch (_) { return null; }
  }
  function findCoords(value) {
    var s = String(value || "");
    var m = s.match(/!2m2!1d(-?\d+(?:\.\d+)?)!2d(-?\d+(?:\.\d+)?)/);
    if (m) return { lat: m[1], lng: m[2] };
    var points = [...s.matchAll(/!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/g)];
    if (points.length) {
      var p = points[points.length - 1];
      return { lat: p[2], lng: p[1] };
    }
    var coords = [...s.matchAll(/!1d(-?\d+(?:\.\d+)?)!2d(-?\d+(?:\.\d+)?)/g)];
    if (coords.length) {
      var c = coords[coords.length - 1];
      return { lat: c[1], lng: c[2] };
    }
    return null;
  }
  function actualMapUrl(frame) {
    var source = frame.getAttribute("data-bali-map-src");
    if (!source || !validKey(apiKey)) return "";
    var parsed = urlParams(source);
    if (!parsed) return "";
    var center = parsed.searchParams.get("q") ||
      parsed.searchParams.get("daddr") ||
      parsed.searchParams.get("saddr");
    if (!center) {
      var coords = findCoords(source);
      if (coords) center = coords.lat + "," + coords.lng;
    }
    if (!center) return "";
    var params = new URLSearchParams();
    params.set("center", center);
    params.set("zoom", parsed.searchParams.get("z") || "14");
    params.set("size", "600x320");
    params.set("scale", "1");
    params.set("maptype", "roadmap");
    params.set("markers", "color:red|" + center);
    params.set("language", "cs");
    params.set("key", apiKey);
    return "https://maps.googleapis.com/maps/api/staticmap?" + params;
  }
  function actualStreetUrl(stage) {
    var source = stage.getAttribute("data-sv-url");
    if (!source || !validKey(apiKey)) return "";
    var coords = findCoords(source);
    if (!coords) return "";
    var heading = source.match(/!3f(-?\d+(?:\.\d+)?)/);
    var pitch = source.match(/!4f(-?\d+(?:\.\d+)?)/);
    var params = new URLSearchParams();
    params.set("size", "600x320");
    params.set("location", coords.lat + "," + coords.lng);
    params.set("fov", "90");
    if (heading) params.set("heading", heading[1]);
    if (pitch) params.set("pitch", pitch[1]);
    params.set("return_error_code", "true");
    params.set("key", apiKey);
    return "https://maps.googleapis.com/maps/api/streetview?" + params;
  }
  function setPreview(host, src, cls) {
    var image = host.querySelector(":scope > img." + cls);
    if (!src) { if (image) image.remove(); return; }
    if (image && image.getAttribute("data-static-url") === src) return;
    if (!image) {
      image = document.createElement("img");
      image.className = "bali-preview-image " + cls;
      image.alt = cls === "bali-static-street" ? "Statický snímek Google Street View" : "Statická mapa Google";
      image.decoding = "async";
      image.loading = "lazy";
      image.referrerPolicy = "strict-origin-when-cross-origin";
      image.addEventListener("error", function () {
        image.removeAttribute("src");
        image.removeAttribute("data-static-url");
        host.classList.add("bali-static-error");
      });
      host.insertBefore(image, host.firstChild);
    }
    image.setAttribute("data-static-url", src);
    host.classList.remove("bali-static-error");
    image.src = src;
  }
  function update(host) {
    if (!validKey(apiKey)) return;
    if (host.classList.contains("bali-map-preview")) {
      var frame = host.nextElementSibling;
      if (frame && frame.tagName === "IFRAME") setPreview(host, actualMapUrl(frame), "bali-static-map");
    } else if (host.classList.contains("sv-stage") && !host.classList.contains("is-loaded")) {
      setPreview(host, actualStreetUrl(host), "bali-static-street");
    }
  }
  function observe(host) {
    if (!host || host.dataset.baliStaticObserved === "1") return;
    host.dataset.baliStaticObserved = "1";
    if (observer) observer.observe(host);
    else update(host);
  }
  function scan() {
    document.querySelectorAll(".bali-map-preview, .sv-stage[data-sv-url]").forEach(observe);
  }
  function refresh() {
    document.querySelectorAll(".bali-map-preview,.sv-stage[data-sv-url]").forEach(function (host) {
      host.dataset.baliStaticObserved = "";
      host.querySelectorAll(":scope > img.bali-preview-image").forEach(function(img){ img.remove(); });
      observe(host);
    });
  }
  function config() {
    var bar = document.createElement("div");
    bar.id = "bali-static-api-bar";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Aktivace skutečných mapových náhledů");
    bar.innerHTML =
      '<div class="bali-static-info"><strong>Skutečné snímky map a Street View</strong>' +
      '<span>Pro zobrazení původních fotografií Google zadej jednou svůj omezený Google Static API klíč. Uloží se pouze v tomto prohlížeči, nikoliv na GitHubu.</span></div>' +
      '<form class="bali-static-form"><input type="password" autocomplete="off" aria-label="Google Maps Static API klíč" placeholder="API klíč Google (AIza…)" required>' +
      '<button type="submit">Zapnout skutečné náhledy</button></form>' +
      '<div class="bali-static-feedback" role="status"></div>';
    var form = bar.querySelector("form"), input = bar.querySelector("input"), feedback = bar.querySelector(".bali-static-feedback");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var next = input.value.trim();
      if (!validKey(next)) { feedback.textContent = "Klíč nemá očekávaný formát."; return; }
      apiKey = next;
      try { localStorage.setItem(KEY, next); } catch (_) {}
      input.value = "";
      bar.hidden = true;
      refresh();
    });
    var root = document.getElementById("hlavni-obsah") || document.querySelector("main") || document.body;
    root.insertBefore(bar, root.firstChild);
    bar.hidden = validKey(apiKey);
  }
  function init() {
    observer = window.IntersectionObserver ? new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) update(entry.target); });
    }, { rootMargin: "120px 0px" }) : null;
    config();
    scan();
    var mutation = new MutationObserver(function (records) {
      if (pending) return;
      if (!records.some(function (r) {
        return r.type === "attributes" && r.attributeName === "data-bali-map-src" ||
          r.type === "childList" && Array.prototype.some.call(r.addedNodes, function(n) {
            return n.nodeType === 1 && (n.matches && n.matches(".bali-map-preview,.sv-stage") ||
              n.querySelector && n.querySelector(".bali-map-preview,.sv-stage"));
          });
      })) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false; scan();
        records.forEach(function (r) {
          if (r.type === "attributes" && r.target.tagName === "IFRAME") {
            var preview = r.target.previousElementSibling;
            if (preview && preview.classList.contains("bali-map-preview") && preview.dataset.baliStaticObserved === "1") update(preview);
          }
        });
      });
    });
    mutation.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:["data-bali-map-src"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
