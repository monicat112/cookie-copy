const pasteButton = document
  .getElementById('pasteButton')
  .addEventListener('click', paste);

async function paste(event) {
  event.preventDefault();
  clearMessage();
  const message = await pasteStorageCookies('cookies');
  setMessage(message);
}

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
