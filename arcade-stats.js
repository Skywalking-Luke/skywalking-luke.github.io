/* LH Cars Arcade visit counter.
   Cookie-free, ID-free. Counts visits and plays per game as daily totals only.
   - Runs ONLY on the arcade hub and the six arcade games listed below. Never on Little Racers or the homepage.
   - No cookies. No identifier of any kind. The only thing kept in the browser is the DAY NUMBER of the last visit
     to each game (one coarse localStorage value) so we can tell "been here before" and roughly how long ago.
   - Sends nothing when the browser says Do Not Track or Global Privacy Control. */
(function () {
  'use strict';
  var ENDPOINT = 'https://lhcars-arcade-stats.lhcars.workers.dev/e';
  var GAMES = { arcade: 'hub', roadstermania: 'roadstermania', missions: 'MissionS', ovalrush: 'OvalRush', turbogp: 'TurboGP', nightstint: 'NightStint', pacenotes: 'PaceNotes' };
  try {
    if (window.__lhArcStats) return;
    var host = location.hostname;
    if (host !== 'lhcars.my' && host !== 'www.lhcars.my') return;
    var seg = (location.pathname.split('/')[1] || '').toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(GAMES, seg)) return; // anything else (Little Racers, homepage...) is ignored
    var game = GAMES[seg];
    var n = navigator;
    if (n.doNotTrack === '1' || window.doNotTrack === '1' || n.msDoNotTrack === '1' || n.globalPrivacyControl === true) return;
    window.__lhArcStats = 1;

    function send(obj) {
      obj.g = game;
      try {
        fetch(ENDPOINT, { method: 'POST', body: JSON.stringify(obj), headers: { 'content-type': 'text/plain' }, keepalive: true, credentials: 'omit', mode: 'cors', referrerPolicy: 'no-referrer' }).catch(function () {});
      } catch (e) {}
    }
    function bucket(d) { return d <= 0 ? '0' : d === 1 ? '1' : d <= 3 ? '2-3' : d <= 7 ? '4-7' : d <= 30 ? '8-30' : '31+'; }

    /* ---- visit (once per page load) ---- */
    function visit() {
      var key = 'lhArcLast:' + game, today = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5), last = null;
      try { var v = parseInt(localStorage.getItem(key), 10); if (isFinite(v) && v > 0 && v <= today) last = v; } catch (e) {}
      try { localStorage.setItem(key, String(today)); } catch (e) {}
      if (last === null) send({ t: 'visit', r: 0 });
      else send({ t: 'visit', r: 1, b: bucket(today - last) });
    }
    if (document.visibilityState === 'prerender') document.addEventListener('visibilitychange', function f() { document.removeEventListener('visibilitychange', f); visit(); });
    else visit();

    /* ---- plays started (games only; read-only observation of the page, never touches game code) ---- */
    if (game === 'hub') return;
    var plays = 0;
    function played() { plays++; send({ t: 'play', n: plays }); }
    function num(el) { return el ? parseInt((el.textContent || '').replace(/\D/g, ''), 10) || 0 : 0; }

    if (game === 'roadstermania') {
      var prevPhase = null;
      setInterval(function () {
        var v = document.querySelector('.viewport[data-phase]');
        var ph = v ? v.getAttribute('data-phase') : null;
        if (ph && ph !== prevPhase) {
          // title->run or crash->run is a new run; crash->run after "watch ad to continue" is not (flag set by the game)
          if (ph === 'run' && (prevPhase === 'title' || (prevPhase === 'crash' && window.__rrContUsed !== true))) played();
          prevPhase = ph;
        }
      }, 250);
    } else {
      var prevOff = null, lastH2 = '', prevScore = 0, pausedScore = 0, retryClicked = false;
      document.addEventListener('click', function (e) { if (e.target && e.target.closest && e.target.closest('#rt')) retryClicked = true; }, true);
      setInterval(function () {
        var m = document.getElementById('menu');
        if (!m) return;
        var off = m.classList.contains('off'), score = num(document.getElementById('score')), started = false;
        if (!off) {
          var h = m.querySelector('h2');
          lastH2 = h ? h.textContent : '';
          if (/paus/i.test(lastH2)) pausedScore = prevScore;
        }
        if (prevOff === false && off) {
          var resumed = /paus/i.test(lastH2) && score >= pausedScore && !retryClicked;      // RESUME from pause
          var continued = m.innerHTML.trim() === '';                       // rewarded-ad continue
          if (!resumed && !continued) started = true;
        }
        if (off && prevOff === true && score < prevScore) started = true;  // R key / retry while running
        if (off) retryClicked = false;
        prevOff = off; prevScore = score;
        if (started) played();
      }, 250);
    }
  } catch (e) {}
})();
