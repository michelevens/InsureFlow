/**
 * Insurons Embeddable Team Signup Widget
 *
 * Usage:
 *   <script src="https://insurons.com/embed/insurons-team-widget.js"
 *           data-key="emb_xxx"
 *           data-mode="inline">
 *   </script>
 *
 * Attributes:
 *   data-key   (required) - Partner API key (must be a team_signup type partner)
 *   data-mode  (optional) - "inline" (default) or "button"
 */
(function () {
  'use strict';

  var scripts = document.querySelectorAll('script[data-key][src*="team-widget"]');
  var scriptEl = scripts[scripts.length - 1];
  if (!scriptEl) return;

  var apiKey = scriptEl.getAttribute('data-key') || '';
  var mode = scriptEl.getAttribute('data-mode') || 'inline';

  var src = scriptEl.getAttribute('src') || '';
  var baseUrl = src.replace(/\/embed\/insurons-team-widget\.js.*$/, '');
  if (!baseUrl) baseUrl = window.location.origin;

  var iframeSrc = baseUrl + '/embed/join?key=' + encodeURIComponent(apiKey);

  var IFRAME_STYLE = 'width:100%;border:none;overflow:hidden;transition:height 0.3s ease;';

  function createIframe(container) {
    var iframe = document.createElement('iframe');
    iframe.src = iframeSrc;
    iframe.style.cssText = IFRAME_STYLE;
    iframe.style.height = '650px';
    iframe.style.minHeight = '500px';
    iframe.setAttribute('allow', 'clipboard-write');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('title', 'Join Our Team');
    container.appendChild(iframe);
    return iframe;
  }

  function attachMessageListener(iframe) {
    window.addEventListener('message', function (e) {
      if (!e.data || typeof e.data.type !== 'string') return;
      if (e.data.type === 'insurons:resize' && e.data.height) {
        iframe.style.height = Math.max(e.data.height + 20, 500) + 'px';
      }
      if (e.data.type === 'insurons:team-signup') {
        var evt = new CustomEvent('insurons:team-signup', { detail: e.data });
        document.dispatchEvent(evt);
      }
    });
  }

  if (mode === 'inline') {
    var wrapper = document.createElement('div');
    wrapper.id = 'insurons-team-widget-container';
    wrapper.style.cssText = 'width:100%;max-width:520px;margin:0 auto;';
    scriptEl.parentNode.insertBefore(wrapper, scriptEl.nextSibling);
    var iframeEl = createIframe(wrapper);
    attachMessageListener(iframeEl);
    return;
  }

  /* Button mode */
  var btn = document.createElement('button');
  btn.id = 'insurons-team-btn';
  btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>&nbsp;Join Our Team';
  btn.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;align-items:center;gap:6px;' +
    'padding:12px 20px;border-radius:50px;border:none;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
    'font-size:14px;font-weight:600;color:#fff;background:linear-gradient(135deg,#1e40af,#2563eb);' +
    'box-shadow:0 4px 20px rgba(37,99,235,0.4);transition:transform 0.2s,box-shadow 0.2s;';
  btn.addEventListener('mouseenter', function () { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 6px 24px rgba(37,99,235,0.5)'; });
  btn.addEventListener('mouseleave', function () { btn.style.transform = ''; btn.style.boxShadow = '0 4px 20px rgba(37,99,235,0.4)'; });
  document.body.appendChild(btn);

  var overlay = document.createElement('div');
  overlay.id = 'insurons-team-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,0.5);display:none;align-items:flex-end;justify-content:center;';

  var modal = document.createElement('div');
  modal.style.cssText = 'width:100%;max-width:520px;max-height:90vh;background:#fff;border-radius:16px 16px 0 0;overflow:hidden;display:flex;flex-direction:column;animation:insuronsSlideUp 0.3s ease;';

  var header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #e2e8f0;background:#f8fafc;';
  header.innerHTML = '<span style="font-weight:600;font-size:14px;color:#1e3a5f;">Join Our Team</span>';
  var closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = 'background:none;border:none;font-size:22px;cursor:pointer;color:#94a3b8;padding:0 4px;line-height:1;';
  closeBtn.onclick = function () { overlay.style.display = 'none'; };
  header.appendChild(closeBtn);
  modal.appendChild(header);

  var body = document.createElement('div');
  body.style.cssText = 'flex:1;overflow-y:auto;';
  modal.appendChild(body);
  overlay.appendChild(modal);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.style.display = 'none'; });
  document.body.appendChild(overlay);

  var modalIframe = createIframe(body);
  modalIframe.style.minHeight = '550px';
  attachMessageListener(modalIframe);

  var styleEl = document.createElement('style');
  styleEl.textContent = '@keyframes insuronsSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}' +
    '@media(min-width:640px){#insurons-team-overlay{align-items:center!important;}' +
    '#insurons-team-overlay>div{border-radius:16px!important;max-height:85vh!important;}}';
  document.head.appendChild(styleEl);

  btn.addEventListener('click', function () { overlay.style.display = 'flex'; });
})();
