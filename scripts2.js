// * https://developer.chrome.com/docs/extensions/reference/cookies/#method-getAll
// * https://developer.chrome.com/docs/extensions/reference/storage/#property-local

const form = document.getElementById('control-row');
const input = document.getElementById('input');
const message = document.getElementById('message');
let domainName;

// The async IIFE is necessary because Chrome <89 does not support top level await.
(async function initPopupWindow() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab?.url) {
    try {
      let url = new URL(tab.url);
      domainName = url.hostname;
    } catch {
      // ignore
    }
  }
})();

const copy = async (event) => {
  event.preventDefault();
  clearMessage();

  const nonDevHostname = domainName.replace(/devapp./g, '');
  const message = await copyDomainCookies(nonDevHostname);

  setMessage(message);
};

const copyButton = document
  .getElementById('copyButton')
  .addEventListener('click', copy);

const copyDomainCookies = async (domain) => {
  let cookiesAdded = 0;
  const tokenNames = ['idToken', 'refreshToken', 'accessToken'];

  try {
    const cookies = await chrome.cookies.getAll({ domain });

    if (cookies.length === 0) {
      return 'No cookies found';
    }

    const tokenCookies = cookies.filter((cookie) => {
      let isToken = false;
      for (let name of tokenNames) {
        if (name === cookie.name) isToken = true;
      }
      return isToken;
    });

    const pending = tokenCookies.map(copyCookie);
    await Promise.all(pending);

    cookiesAdded = pending.length;
  } catch (error) {
    return `Unexpected error: ${error.message}`;
  }

  return `Copied ${cookiesAdded} cookies`;
};

function copyCookie(cookie) {
  chrome.storage.local.set({ sdCookie: cookie });
  // .then(() => {
  // console.log('Added ', cookie.name);
  // });
}

function deleteCookie(cookie) {
  // Cookie deletion is largely modeled off of how deleting cookies works when using HTTP headers.
  // Specific flags on the cookie object like `secure` or `hostOnly` are not exposed for deletion
  // purposes. Instead, cookies are deleted by URL, name, and storeId. Unlike HTTP headers, though,
  // we don't have to delete cookies by setting Max-Age=0; we have a method for that ;)
  //
  // To remove cookies set with a Secure attribute, we must provide the correct protocol in the
  // details object's `url` property.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#Secure
  const protocol = cookie.secure ? 'https:' : 'http:';

  // Note that the final URL may not be valid. The domain value for a standard cookie is prefixed
  // with a period (invalid) while cookies that are set to `cookie.hostOnly == true` do not have
  // this prefix (valid).
  // https://developer.chrome.com/docs/extensions/reference/cookies/#type-Cookie
  const cookieUrl = `${protocol}//${cookie.domain}${cookie.path}`;

  return chrome.cookies.remove({
    url: cookieUrl,
    name: cookie.name,
    storeId: cookie.storeId,
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
