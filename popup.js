// * https://developer.chrome.com/docs/extensions/reference/cookies/#method-getAll
// * https://developer.chrome.com/docs/extensions/reference/storage/#property-local

const storage = chrome.storage.session;
const form = document.getElementById('control-row');
const message = document.getElementById('message');
const tokenNames = ['idToken', 'refreshToken', 'accessToken'];
let domainName;
let url;

const copyButton = document
  .getElementById('copyButton')
  .addEventListener('click', copy);

const pasteButton = document
  .getElementById('pasteButton')
  .addEventListener('click', paste);

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

async function copy(event) {
  event.preventDefault();
  clearMessage();
  const message = await copyDomainCookies(domainName);
  setMessage(message);
}

async function paste(event) {
  event.preventDefault();
  clearMessage();
  const message = await pasteStorageCookies('cookies');
  setMessage(message);
}

const copyDomainCookies = async (domain) => {
  let cookieCount = 0;

  try {
    const cookies = await chrome.cookies.getAll({ domain });

    if (cookies.length === 0) {
      return 'No cookies found';
    }

    const tokenCookies = getTokenCookies(cookies);
    await storage.set({ cookies: tokenCookies });
    cookieCount = tokenCookies.length;
  } catch (error) {
    return `Unexpected error: ${error.message}`;
  }

  return `Copied ${cookieCount} ${pluralizeCookie(cookieCount)}`;
};

const pasteStorageCookies = async (name) => {
  try {
    const cookies = await storage.get([name]);
    const message = await pasteCookies(cookies);
    return message;
  } catch (error) {
    return `Unexpected error: ${error.message}`;
  }
};

const pasteCookies = async (cookies) => {
  let cookieCount = 0;

  try {
    if (cookies.length === 0) {
      return 'No cookies found';
    }

    let pending = cookies.cookies.map(pasteCookie);
    await Promise.all(pending);

    cookieCount = pending.length;
    await chrome.tabs.reload();
  } catch (error) {
    return `Unexpected error: ${error.message}`;
  }

  return `Set ${cookieCount} ${pluralizeCookie(cookieCount)}`;
};

const pasteCookie = (cookie) => {
  // get rid of properties that the chrome api doesn't want
  delete cookie.hostOnly;
  delete cookie.session;

  return chrome.cookies.set({
    ...cookie,
    domain: domainName,
    url: `${url.protocol}//${domainName}`,
  });
};

// Hoisted Utilities

function pluralizeCookie(count) {
  if (count === 1) return 'cookie';
  return 'cookies';
}

function getTokenCookies(cookies) {
  return cookies.filter((cookie) => {
    let isToken = false;
    for (let name of tokenNames) {
      if (name === cookie.name) isToken = true;
    }
    return isToken;
  });
}

function setMessage(str) {
  message.textContent = str;
  message.hidden = false;
}

function clearMessage() {
  message.hidden = true;
  message.textContent = '';
}
