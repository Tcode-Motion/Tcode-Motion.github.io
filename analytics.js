// ── GOOGLE ANALYTICS 4 LAZY LOADED INTEGRATION ──
// Measurement ID: G-N9DTTD46FR

(function() {
  // 1. Consent Mode Default (GDPR/EEA Compliance ready)
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag; // Make globally accessible

  // Set default consent state (denied by default, can be updated via a consent banner)
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'wait_for_update': 500
  });

  gtag('js', new Date());
  gtag('config', 'G-N9DTTD46FR', {
    'send_page_view': true,
    'cookie_flags': 'SameSite=None;Secure'
  });

  // 2. Lazy Load gtag.js on first user interaction to optimize LCP/FCP loading speeds
  function loadAnalyticsScript() {
    if (window.gaLoaded) return;
    window.gaLoaded = true;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-N9DTTD46FR';
    document.head.appendChild(script);

    // If consent was previously granted and saved in localStorage, update the permissions
    let consentAccepted = false;
    try {
      consentAccepted = localStorage.getItem('cookie_consent') === 'granted';
    } catch (e) {
      // Safe fallback if localStorage is disabled/restricted
    }
    
    if (consentAccepted) {
      gtag('consent', 'update', {
        'analytics_storage': 'granted',
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted'
      });
    }
  }

  // Bind interaction events for lazy loading
  const loadEvents = ['mouseover', 'keydown', 'touchstart', 'scroll'];
  loadEvents.forEach(event => {
    window.addEventListener(event, loadAnalyticsScript, { once: true, passive: true });
  });

  // 3. Track Custom Events (Downloads, Outbound Clicks, Scroll Depth)
  document.addEventListener('DOMContentLoaded', () => {
    // A. Outbound & Download tracking via click delegation
    document.body.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      const isDownload = href.includes('releases/download') || href.includes('_x64.exe') || link.classList.contains('nav-dl') || link.classList.contains('mob-dl');
      const isOutbound = href.startsWith('http') && !href.includes(window.location.hostname);

      if (isDownload) {
        gtag('event', 'file_download', {
          'file_name': href.split('/').pop(),
          'file_extension': 'exe',
          'link_url': href
        });
      } else if (isOutbound) {
        gtag('event', 'click', {
          'event_category': 'outbound',
          'event_label': href,
          'transport_type': 'beacon'
        });
      }
    });

    // B. Throttled Scroll Depth Tracking (25%, 50%, 75%, 100%)
    let scrollThresholds = [25, 50, 75, 100];
    let reachedThresholds = {};
    let scrollScheduled = false;

    window.addEventListener('scroll', () => {
      if (scrollScheduled) return;
      scrollScheduled = true;

      requestAnimationFrame(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        if (docHeight <= 0) {
          scrollScheduled = false;
          return;
        }

        const scrollPercent = Math.round((scrollTop / docHeight) * 100);

        scrollThresholds.forEach(t => {
          if (scrollPercent >= t && !reachedThresholds[t]) {
            reachedThresholds[t] = true;
            gtag('event', 'scroll_depth', {
              'percent': t
            });
          }
        });

        scrollScheduled = false;
      });
    }, { passive: true });
  });
})();
