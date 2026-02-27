/**
 * Insurons Embeddable Quote Widget
 *
 * Usage:
 *   <script src="https://insurons.com/embed/insurons-widget.js"
 *           data-key="emb_xxx"
 *           data-type="auto"
 *           data-mode="inline">
 *   </script>
 *
 * Attributes:
 *   data-key   (required) - Partner API key
 *   data-type  (optional) - Pre-selected insurance type slug
 *   data-mode  (optional) - "inline" (default) or "button"
 */
(function () {
  'use strict';

  // Find our own script tag (exclude team-widget scripts)
  var scripts = document.querySelectorAll('script[data-key]:not([src*="team-widget"])');
  var scriptEl = scripts[scripts.length - 1];
  if (!scriptEl) return;

  var apiKey = scriptEl.getAttribute('data-key') || '';
  var insuranceType = scriptEl.getAttribute('data-type') || '';
  var mode = scriptEl.getAttribute('data-mode') || 'inline';

  // Determine base URL from script src
  var src = scriptEl.getAttribute('src') || '';
  var baseUrl = src.replace(/\/embed\/insurons-widget\.js.*$/, '');
  if (!baseUrl) baseUrl = window.location.origin;

  var iframeSrc = baseUrl + '/embed/quote?key=' + encodeURIComponent(apiKey);
  if (insuranceType) iframeSrc += '&type=' + encodeURIComponent(insuranceType);

  // Shared styles
  var IFRAME_STYLE = 'width:100%;border:none;overflow:hidden;transition:height 0.3s ease;';

  function createIframe(container) {
    var iframe = document.createElement('iframe');
    iframe.src = iframeSrc;
    iframe.style.cssText = IFRAME_STYLE;
    iframe.style.height = '600px';
    iframe.style.minHeight = '400px';
    iframe.setAttribute('allow', 'clipboard-write');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('title', 'Insurance Quote Widget');
    container.appendChild(iframe);
    return iframe;
  }

  // Listen for postMessage events from the widget iframe
  function attachMessageListener(iframe, onEvent) {
    window.addEventListener('message', function (e) {
      if (!e.data || e.data.source !== 'insurons-widget') return;
      // Auto-resize
      if (e.data.event === 'insurons:resize' && e.data.height) {
        iframe.style.height = Math.max(e.data.height + 20, 400) + 'px';
      }
      if (onEvent) onEvent(e.data);
    });
  }

  /* ── Inline mode ── */
  if (mode === 'inline') {
    var wrapper = document.createElement('div');
    wrapper.id = 'insurons-widget-container';
    wrapper.style.cssText = 'width:100%;max-width:560px;margin:0 auto;';
    scriptEl.parentNode.insertBefore(wrapper, scriptEl.nextSibling);

    var iframeEl = createIframe(wrapper);
    attachMessageListener(iframeEl, null);
    return;
  }

  /* ── Button mode ── */
  // Floating button
  var btn = document.createElement('button');
  btn.id = 'insurons-widget-btn';
  btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BC9C22" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>&nbsp;Get Insurance Quote';
  btn.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;align-items:center;gap:6px;' +
    'padding:12px 20px;border-radius:50px;border:none;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
    'font-size:14px;font-weight:600;color:#fff;background:linear-gradient(135deg,#102a43,#011434);' +
    'box-shadow:0 4px 20px rgba(1,20,52,0.4);transition:transform 0.2s,box-shadow 0.2s;';
  btn.addEventListener('mouseenter', function () { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 6px 24px rgba(1,20,52,0.5)'; });
  btn.addEventListener('mouseleave', function () { btn.style.transform = ''; btn.style.boxShadow = '0 4px 20px rgba(1,20,52,0.4)'; });
  document.body.appendChild(btn);

  // Modal overlay
  var overlay = document.createElement('div');
  overlay.id = 'insurons-widget-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,0.5);display:none;' +
    'align-items:flex-end;justify-content:center;';

  var modal = document.createElement('div');
  modal.style.cssText = 'width:100%;max-width:560px;max-height:90vh;background:#fff;border-radius:16px 16px 0 0;' +
    'overflow:hidden;display:flex;flex-direction:column;animation:insuronsSlideUp 0.3s ease;';

  // Modal header
  var header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #e2e8f0;background:#f8fafc;';
  header.innerHTML = '<span style="font-weight:600;font-size:14px;color:#011434;">Insurance Quote</span>';
  var closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = 'background:none;border:none;font-size:22px;cursor:pointer;color:#94a3b8;padding:0 4px;line-height:1;';
  closeBtn.onclick = function () { overlay.style.display = 'none'; };
  header.appendChild(closeBtn);
  modal.appendChild(header);

  // Modal body (iframe container)
  var body = document.createElement('div');
  body.style.cssText = 'flex:1;overflow-y:auto;';
  modal.appendChild(body);
  overlay.appendChild(modal);

  // Click outside to close
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) overlay.style.display = 'none';
  });

  document.body.appendChild(overlay);

  var modalIframe = createIframe(body);
  modalIframe.style.minHeight = '500px';
  attachMessageListener(modalIframe, null);

  // Add slide-up animation
  var styleEl = document.createElement('style');
  styleEl.textContent = '@keyframes insuronsSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}' +
    '@media(min-width:640px){#insurons-widget-overlay{align-items:center!important;}' +
    '#insurons-widget-overlay>div{border-radius:16px!important;max-height:85vh!important;}}';
  document.head.appendChild(styleEl);

  btn.addEventListener('click', function () {
    overlay.style.display = 'flex';
  });
})();
