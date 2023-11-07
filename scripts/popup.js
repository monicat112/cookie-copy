const storage = chrome.storage.session;
const message = document.getElementById('message');
const tokenNames = ['idToken', 'refreshToken', 'accessToken'];
let domainName;
let url;

// The async IIFE is necessary because Chrome <89 does not support top level await.
(async function initPopupWindow() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab?.url) {
    try {
      url = new URL(tab.url);
      // cleanup the host name
      domainName = url.host
        .replace(/devapp\./g, '')
        .replace(`:${url.port}`, '');
    } catch {
      // ignore
    }
  }
})();

// Shared Utilities

function pluralizeCookie(count) {
  if (count === 1) return 'cookie';
  return 'cookies';
}

function setMessage(str) {
  message.textContent = str;
  message.hidden = false;
}

function clearMessage() {
  message.hidden = true;
  message.textContent = '';
}
