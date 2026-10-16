/* LH Cars Arcade ad loader. Paste your AdSense publisher ID below to switch ads on.
   Empty ADSENSE_CLIENT = no ad scripts load, slots stay collapsed, reward buttons stay hidden. */
(function () {
  var CONFIG = {
    ADSENSE_CLIENT: '',      // e.g. 'ca-pub-1234567890123456'
    BANNER_SLOT: '',         // display ad unit slot id from AdSense (Ads > By ad unit)
    H5_REWARDED: true,       // Google H5 Games Ads (Ad Placement API) rewarded continues
    TEST_MODE: false         // true = data-adbreak-test="on" while H5 Games Ads is in review
  };
  var on = !!CONFIG.ADSENSE_CLIENT;
  var loaded = false;
  function load() {
    if (!on || loaded) return;
    loaded = true;
    window.adsbygoogle = window.adsbygoogle || [];
    window.adBreak = window.adConfig = function (o) { window.adsbygoogle.push(o); };
    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(CONFIG.ADSENSE_CLIENT);
    s.setAttribute('data-ad-client', CONFIG.ADSENSE_CLIENT);
    if (CONFIG.TEST_MODE) s.setAttribute('data-adbreak-test', 'on');
    document.head.appendChild(s);
    if (CONFIG.H5_REWARDED) window.adConfig({ preloadAdBreaks: 'on', sound: 'on' });
  }
  /* Banner: fills an element with an AdSense unit. Element stays display:none unless ads are on. */
  function banner(el) {
    if (!el) return;
    if (!on || !CONFIG.BANNER_SLOT) { el.style.display = 'none'; return; }
    load();
    el.style.display = 'block';
    el.innerHTML = '<div style="font:8px monospace;opacity:.5;margin-bottom:4px">ADVERTISEMENT</div>' +
      '<ins class="adsbygoogle" style="display:block" data-ad-client="' + CONFIG.ADSENSE_CLIENT +
      '" data-ad-slot="' + CONFIG.BANNER_SLOT + '" data-ad-format="horizontal" data-full-width-responsive="true"></ins>';
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }
  /* Rewarded: offerReward(onAvailable) asks the provider for a rewarded ad. If one is ready,
     onAvailable(show) is called; call show() from a button tap. show() resolves true if the ad was watched. */
  var providers = {
    h5: function (onAvailable) {
      load();
      var done = null, granted = false;
      try {
        window.adBreak({
          type: 'reward', name: 'continue',
          beforeReward: function (showAdFn) {
            onAvailable(function () { return new Promise(function (r) { done = r; showAdFn(); }); });
          },
          adViewed: function () { granted = true; },
          adDismissed: function () { granted = false; },
          adBreakDone: function () { if (done) done(granted); done = null; }
        });
      } catch (e) {}
    }
  };
  function offerReward(onAvailable) {
    if (on && CONFIG.H5_REWARDED) providers.h5(onAvailable);
  }
  window.LHAds = { enabled: on, rewardEnabled: on && CONFIG.H5_REWARDED, banner: banner, offerReward: offerReward, providers: providers };
  if (on) load();
  function auto() { var els = document.querySelectorAll('[data-lh-ad]'); for (var i = 0; i < els.length; i++) banner(els[i]); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
