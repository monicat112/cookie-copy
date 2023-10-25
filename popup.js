// * https://developer.chrome.com/docs/extensions/reference/cookies/#method-getAll
// * https://developer.chrome.com/docs/extensions/reference/storage/#property-local

// todo: cookie data isn't saving for some reason? "failed to parse cookie named idToken"

const storage = chrome.storage.session;
const form = document.getElementById('control-row');
const input = document.getElementById('input');
const message = document.getElementById('message');
let domainName;
// todo: can we make this more universal? A checkbox or input field or something?
const tokenNames = ['idToken', 'refreshToken', 'accessToken'];

// The async IIFE is necessary because Chrome <89 does not support top level await.
(async function initPopupWindow() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab?.url) {
    try {
      let url = new URL(tab.url);
      domainName = url.hostname.replace(/devapp\./g, '');
      input.value = 'http://localhost:5173';
    } catch {
      // ignore
    }
  }

  input.focus();
})();

const getTokenCookies = (cookies) => {
  return cookies.filter((cookie) => {
    let isToken = false;
    for (let name of tokenNames) {
      if (name === cookie.name) isToken = true;
    }
    return isToken;
  });
};

// Handle copy button action
const copy = async (event) => {
  event.preventDefault();
  clearMessage();
  const message = await copyDomainCookies(domainName);
  setMessage(message);
};

const copyButton = document
  .getElementById('copyButton')
  .addEventListener('click', copy);

// Handle paste button action
const paste = async (event) => {
  event.preventDefault();
  clearMessage();

  // const nonDevHostname = domainName.replace(/devapp./g, '');
  // const message = await pasteDomainCookies(nonDevHostname);

  // storage.get(['cookies']).then((result) => {
  //   console.log('Got cookie: ', result);
  // todo: this will have to change since we're in an extension environment
  // const cookie = result;
  // cookie.split('; ').forEach((c) => (document.cookie = c));
  // });

  const message = await pasteStorageCookies('cookies');
  setMessage(message);
};

const pasteButton = document
  .getElementById('pasteButton')
  .addEventListener('click', paste);

const copyDomainCookies = async (domain) => {
  let cookiesAdded = 0;

  try {
    const cookies = await chrome.cookies.getAll({ domain });

    if (cookies.length === 0) {
      return 'No cookies found';
    }

    const tokenCookies = getTokenCookies(cookies);
    await storage.set({ cookies: tokenCookies });
    cookiesAdded = tokenCookies.length;
  } catch (error) {
    return `Unexpected error: ${error.message}`;
  }

  return `Copied ${cookiesAdded} cookies`;
};

const pasteStorageCookies = async (name) => {
  try {
    const cookies = await storage.get(['cookies']);
    const message = await pasteCookies(cookies);
    return message;
  } catch (error) {
    return `Unexpected error: ${error.message}`;
  }
};

const pasteCookies = async (cookies) => {
  let cookiesSet = 0;

  try {
    if (cookies.length === 0) {
      return 'No cookies found';
    }

    let pending = cookies.cookies.map(pasteCookie);
    await Promise.all(pending);

    cookiesSet = pending.length;
  } catch (error) {
    return `Unexpected error: ${error.message}`;
  }

  return `Set ${cookiesSet} cookie(s)`;
};

const pasteCookie = (cookie) => {
  // get rid of properties that the chrome api doesn't want
  delete cookie.hostOnly;
  delete cookie.session;

  // configure the url
  // const protocol = cookie.secure ? 'https:' : 'http:';
  // const domain = cookie.domain.startsWith('.')
  //   ? cookie.domain.slice(1)
  //   : cookie.domain;
  // const cookieUrl = `${protocol}//${domain}${cookie.path}`;

  return chrome.cookies.set({
    ...cookie,
    url: input.value,
  });
};

function setMessage(str) {
  message.textContent = str;
  message.hidden = false;
}

function clearMessage() {
  message.hidden = true;
  message.textContent = '';
}
