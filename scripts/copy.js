const copyButton = document
  .getElementById('copyButton')
  .addEventListener('click', copy);

async function copy(event) {
  event.preventDefault();
  clearMessage();
  const message = await copyDomainCookies(domainName);
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

// Hoisted Utilities

function getTokenCookies(cookies) {
  return cookies.filter((cookie) => {
    let isToken = false;
    for (let name of tokenNames) {
      if (name === cookie.name) isToken = true;
    }
    return isToken;
  });
}
