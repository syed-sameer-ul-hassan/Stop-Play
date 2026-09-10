let hudHost: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

export interface HUDOptions {
  type: 'paused' | 'resumed' | 'info';
  title: string;
  domain?: string;
  onPlayClick?: () => void;
}

export function showInPageHUD(options: HUDOptions) {
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }

  if (!hudHost) {
    hudHost = document.createElement('div');
    hudHost.id = 'stop-play-hud-root';
    hudHost.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 0;
      overflow: visible;
      z-index: 2147483647;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    (document.documentElement || document.body).appendChild(hudHost);
    shadowRoot = hudHost.attachShadow({ mode: 'open' });
  }

  if (!shadowRoot) return;

  const isPaused = options.type === 'paused';
  const isResumed = options.type === 'resumed';

  const accentColor = isPaused ? '#f43f5e' : isResumed ? '#10b981' : '#3b82f6';
  const glowShadow = isPaused
    ? 'rgba(244, 63, 94, 0.35)'
    : isResumed
    ? 'rgba(16, 185, 129, 0.35)'
    : 'rgba(59, 130, 246, 0.35)';

  const iconSvg = isPaused
    ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`
    : isResumed
    ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>`
    : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

  const statusLabel = isPaused
    ? 'Auto-Paused'
    : isResumed
    ? 'Resumed Playback'
    : 'Stop Play Alert';

  const hintText = isPaused
    ? 'Will auto-resume when you return'
    : 'Playing right where you left off';

  shadowRoot.innerHTML = `
    <style>
      .hud-pill {
        position: fixed;
        top: 18px;
        left: 50%;
        transform: translateX(-50%) translateY(-60px) scale(0.92);
        opacity: 0;
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 12px;
        background: rgba(11, 15, 25, 0.94);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.6), 0 0 20px 0 ${glowShadow};
        border-radius: 9999px;
        padding: 8px 14px 8px 10px;
        color: #f1f5f9;
        font-size: 13px;
        line-height: 1.3;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        user-select: none;
        max-width: 90vw;
        box-sizing: border-box;
      }
      .hud-pill.show {
        transform: translateX(-50%) translateY(0) scale(1);
        opacity: 1;
      }
      .hud-pill.hide {
        transform: translateX(-50%) translateY(-60px) scale(0.92);
        opacity: 0;
      }
      .hud-icon-badge {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: ${accentColor}22;
        border: 1.5px solid ${accentColor};
        color: ${accentColor};
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .hud-content {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .hud-header {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .hud-badge {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: ${accentColor};
      }
      .hud-dot {
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.4);
      }
      .hud-domain {
        font-size: 11px;
        color: #94a3b8;
        font-weight: 500;
      }
      .hud-title {
        font-size: 12px;
        font-weight: 600;
        color: #e2e8f0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 240px;
      }
      .hud-hint {
        font-size: 11px;
        color: #64748b;
        white-space: nowrap;
      }
      .hud-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-left: 4px;
      }
      .hud-btn-action {
        background: ${accentColor}20;
        border: 1px solid ${accentColor}50;
        color: ${accentColor};
        border-radius: 9999px;
        padding: 5px 11px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s;
      }
      .hud-btn-action:hover {
        background: ${accentColor}35;
        border-color: ${accentColor};
        color: #fff;
        transform: scale(1.03);
      }
      .hud-btn-close {
        background: transparent;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 4px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
      }
      .hud-btn-close:hover {
        color: #e2e8f0;
      }
    </style>

    <div id="stop-play-pill" class="hud-pill">
      <div class="hud-icon-badge">
        ${iconSvg}
      </div>
      <div class="hud-content">
        <div class="hud-header">
          <span class="hud-badge">${statusLabel}</span>
          ${options.domain ? `<span class="hud-dot"></span><span class="hud-domain">${options.domain}</span>` : ''}
        </div>
        <div class="hud-title">${options.title || 'HTML5 Video'}</div>
        <div class="hud-hint">${hintText}</div>
      </div>

      <div class="hud-actions">
        ${
          isPaused && options.onPlayClick
            ? `<button id="hud-resume-btn" class="hud-btn-action">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>Play</span>
              </button>`
            : ''
        }
        <button id="hud-close-btn" class="hud-btn-close" title="Dismiss">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  `;

  const pill = shadowRoot.getElementById('stop-play-pill');
  if (!pill) return;

  requestAnimationFrame(() => {
    pill.classList.add('show');
  });

  function dismiss() {
    if (!pill) return;
    pill.classList.remove('show');
    pill.classList.add('hide');
    setTimeout(() => {
      if (shadowRoot) shadowRoot.innerHTML = '';
    }, 400);
  }

  const resumeBtn = shadowRoot.getElementById('hud-resume-btn');
  if (resumeBtn && options.onPlayClick) {
    resumeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      options.onPlayClick?.();
      showInPageHUD({
        type: 'resumed',
        title: options.title,
        domain: options.domain,
      });
    });
  }

  const closeBtn = shadowRoot.getElementById('hud-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismiss();
    });
  }

  const duration = isResumed ? 2200 : 3800;
  dismissTimer = setTimeout(dismiss, duration);

  pill.addEventListener('mouseenter', () => {
    if (dismissTimer) clearTimeout(dismissTimer);
  });
  pill.addEventListener('mouseleave', () => {
    dismissTimer = setTimeout(dismiss, 2000);
  });
}
