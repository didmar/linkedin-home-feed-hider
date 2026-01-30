// ==UserScript==
// @name         LinkedIn Home Feed Hider
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Hide LinkedIn home feed with toggle button
// @author       Didier Marin
// @match        https://www.linkedin.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const FEED_STYLE_ID = 'linkedin-feed-hider-feed';
    const BUTTON_STYLE_ID = 'linkedin-feed-hider-button';
    const BUTTON_ID = 'linkedin-feed-toggle-btn';

    const FEED_CSS = `div.scaffold-finite-scroll.scaffold-finite-scroll--infinite { display: none !important; }`;
    const BUTTON_CSS = `
          #${BUTTON_ID} {
              position: fixed;
              top: 70px;
              right: 20px;
              z-index: 9999;
              padding: 10px 16px;
              background: #0a66c2;
              color: white;
              border: none;
              border-radius: 20px;
              cursor: pointer;
              font-weight: 600;
              font-size: 14px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
          #${BUTTON_ID}:hover {
              background: #004182;
          }
      `;

    let feedHidden = true;
    let lastPath = location.pathname;

    function ensureFeedStyle() {
        let styleEl = document.getElementById(FEED_STYLE_ID);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = FEED_STYLE_ID;
            styleEl.textContent = FEED_CSS;
            (document.head || document.documentElement).appendChild(styleEl);
        }
        return styleEl;
    }

    function ensureButtonStyle() {
        let styleEl = document.getElementById(BUTTON_STYLE_ID);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = BUTTON_STYLE_ID;
            styleEl.textContent = BUTTON_CSS;
            (document.head || document.documentElement).appendChild(styleEl);
        }
        return styleEl;
    }

    function toggleFeed() {
        const styleEl = ensureFeedStyle();
        const btn = document.getElementById(BUTTON_ID);

        feedHidden = !feedHidden;

        if (feedHidden) {
            styleEl.disabled = false;
            if (btn) btn.textContent = 'Show Feed';
        } else {
            styleEl.disabled = true;
            if (btn) btn.textContent = 'Hide Feed';
        }
    }

    function resetFeedState() {
        feedHidden = true;
        const styleEl = ensureFeedStyle();
        styleEl.disabled = false;
    }

    function addButton() {
        if (document.getElementById(BUTTON_ID)) return;
        if (!document.body) return;

        ensureButtonStyle();

        const btn = document.createElement('button');
        btn.id = BUTTON_ID;
        btn.textContent = 'Show Feed';
        btn.addEventListener('click', toggleFeed);
        document.body.appendChild(btn);
    }

    function removeButton() {
        const btn = document.getElementById(BUTTON_ID);
        if (btn) btn.remove();
    }

    function onPageChange() {
        const currentPath = location.pathname;
        const isOnFeed = currentPath === '/feed/';

        if (currentPath !== lastPath) {
            lastPath = currentPath;
            if (isOnFeed) {
                resetFeedState();
            }
        }

        if (isOnFeed) {
            ensureFeedStyle();
            addButton();
        } else {
            removeButton();
        }
    }

    // Intercept History API for SPA navigation detection
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
        originalPushState.apply(this, arguments);
        onPageChange();
    };

    history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        onPageChange();
    };

    window.addEventListener('popstate', onPageChange);

    setInterval(onPageChange, 1000);

    // Initial injection
    ensureFeedStyle();

    function init() {
        if (document.body) {
            onPageChange();
        } else {
            const observer = new MutationObserver((mutations, obs) => {
                if (document.body) {
                    obs.disconnect();
                    onPageChange();
                }
            });
            observer.observe(document.documentElement, { childList: true });
        }
    }

    init();
})();
