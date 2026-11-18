(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.getElementById('nav');
  var hero = document.querySelector('.hero');
  var dock = document.getElementById('dock');
  var quote = document.getElementById('quote');
  var areaPhoto = document.querySelector('.area-photo');
  var tabList = document.getElementById('tabs');
  var tabLinks = Array.prototype.slice.call(document.querySelectorAll('#tabs a'));
  var ticking = false;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function onScroll() {
    var y = window.scrollY;
    var h = window.innerHeight;
    var p = clamp(y / h, 0, 1);
    if (!reduce) hero.style.setProperty('--p', p.toFixed(4));
    nav.classList.toggle('solid', y > h * 0.6);
    if (y < h * 0.4) {
      tabLinks.forEach(function (a) { a.classList.remove('active'); });
      if (tabList.scrollLeft > 0) tabList.scrollLeft = 0;
    }
    var nearQuote = quote.getBoundingClientRect().top < h * 0.8;
    dock.classList.toggle('show', y > h * 0.75 && !nearQuote);
    if (!reduce && areaPhoto) {
      var r = areaPhoto.getBoundingClientRect();
      var mp = clamp((h - r.top) / (h + r.height), 0, 1) * 2 - 1;
      areaPhoto.style.setProperty('--mp', mp.toFixed(3));
    }
    baScroll();
    svcScroll();
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);

  /* active tab follows the section in the middle of the screen */
  var sections = tabLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var tabIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      tabLinks.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + e.target.id;
        a.classList.toggle('active', on);
        if (on && window.innerWidth <= 1120) {
          tabList.scrollTo({ left: a.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
        }
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(function (s) { if (s) tabIO.observe(s); });

  /* services: sticky photo swaps to whichever row is in the middle */
  var stageImgs = document.querySelectorAll('.svc-stage img');
  var stageNum = document.getElementById('stage-num');
  var svcs = Array.prototype.slice.call(document.querySelectorAll('.svc'));
  var curSvc = -1;
  function svcScroll() {
    var mid = window.innerHeight / 2, best = 0, bestD = Infinity;
    svcs.forEach(function (s, i) {
      var r = s.getBoundingClientRect();
      var d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best === curSvc) return;
    curSvc = best;
    var key = svcs[best].getAttribute('data-key');
    svcs.forEach(function (s, i) { s.classList.toggle('is-active', i === best); });
    stageImgs.forEach(function (img) { img.classList.toggle('on', img.getAttribute('data-key') === key); });
    stageNum.textContent = ('0' + (best + 1)).slice(-2);
  }

  /* before / after: washes itself as you scroll (both ways) until someone drags it */
  var ba = document.getElementById('ba');
  var baRange = document.getElementById('ba-range');
  var tagB = ba.querySelector('.ba-tag-b');
  var tagA = ba.querySelector('.ba-tag-a');
  var baTouched = false;
  function setX(v) {
    ba.style.setProperty('--x', v + '%');
    baRange.value = v;
    tagB.style.opacity = v < 14 ? 0 : 1;
    tagA.style.opacity = v > 86 ? 0 : 1;
  }
  function baScroll() {
    if (baTouched || reduce) return;
    var r = ba.getBoundingClientRect();
    var h = window.innerHeight;
    var t = clamp((h * 0.72 - r.top) / (h * 0.62), 0, 1);
    var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    setX((92 - e * 84).toFixed(2));
  }
  baRange.addEventListener('input', function () { baTouched = true; setX(+baRange.value); });
  setX(reduce ? 50 : 92);

  /* rating counts up once */
  var ratingEl = document.getElementById('rating-num');
  if (!reduce && ratingEl) {
    var ratingIO = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      ratingIO.disconnect();
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var k = clamp((ts - start) / 1400, 0, 1);
        ratingEl.textContent = ((1 - Math.pow(1 - k, 3)) * 5).toFixed(1);
        if (k < 1) requestAnimationFrame(step);
      }
      ratingEl.textContent = '0.0';
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
    ratingIO.observe(ratingEl);
  }

  /* reveals */
  if (!reduce && 'IntersectionObserver' in window) {
    var rvEls = document.querySelectorAll('.services-intro, .results-head, .safe-copy, .steps li, .quotes blockquote, .rating, .area-copy, .faq-wrap h2, .quote-call, .quote-form, .work .wrap');
    var rvIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rvIO.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    rvEls.forEach(function (el, i) {
      el.classList.add('rv');
      if (el.matches('.steps li')) el.style.transitionDelay = (Array.prototype.indexOf.call(el.parentNode.children, el) * 0.1) + 's';
      rvIO.observe(el);
    });

    var gis = document.querySelectorAll('.gallery li');
    var gIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = Array.prototype.indexOf.call(gis, e.target) % 4;
        e.target.style.transitionDelay = (i * 0.08) + 's';
        e.target.classList.add('in');
        gIO.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    gis.forEach(function (li) { li.classList.add('gi'); gIO.observe(li); });
  }

  /* quote form: no email on file, so it opens a pre-filled text */
  var form = document.getElementById('quote-form');
  var note = document.getElementById('form-note');
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var name = form.name.value.trim();
    var phone = form.phone.value.trim();
    form.name.classList.toggle('bad', !name);
    form.phone.classList.toggle('bad', !phone);
    if (!name || !phone) {
      note.textContent = 'Add your name and phone number so we can get back to you.';
      (name ? form.phone : form.name).focus();
      return;
    }
    var body = 'Quote request from the website\n' +
      'Name: ' + name + '\n' +
      'Phone: ' + phone + '\n' +
      'Need: ' + form.job.value + '\n' +
      (form.city.value.trim() ? 'City: ' + form.city.value.trim() + '\n' : '') +
      (form.details.value.trim() ? 'Details: ' + form.details.value.trim() : '');
    if (window.matchMedia('(pointer: coarse)').matches) {
      window.location.href = 'sms:+19712043107?&body=' + encodeURIComponent(body);
      note.innerHTML = 'Your texting app should open with everything filled in. If it didn\'t, call <a href="tel:+19712043107">(971) 204-3107</a>.';
    } else {
      note.innerHTML = 'On a computer? Call <a href="tel:+19712043107">(971) 204-3107</a> or text these details to that number from your phone. We copied them for you.';
      if (navigator.clipboard) navigator.clipboard.writeText(body).catch(function () {});
    }
  });

  onScroll();
})();
