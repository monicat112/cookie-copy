const storageKey = 'cookie';

window.addEventListener('storage', (e) => {
  console.log(`Key Changed: ${e.key}`);
  console.log(`New Value: ${e.newValue}`);
});

const copy2 = () => {
  const cookie = document.cookie;
  chrome.storage.local.set({ key: cookie }).then(() => {
    console.log('Value is set: ', cookie);
  });
};

const paste2 = () => {
  chrome.storage.local.get(['key']).then((result) => {
    console.log('Value is added: ', result);
    const cookie = result;
    cookie.split('; ').forEach((c) => (document.cookie = c));
  });
};

// const copy = () => {
//   console.log('copying');
//   const cookie = document.cookie;
//   localStorage.setItem(storageKey, cookie);
// };

// const paste = () => {
//   const cookie = localStorage.getItem(storageKey);
//   console.log('pasting: ', cookie);
//   cookie.split('; ').forEach((c) => (document.cookie = c));
// };

const copyButton2 = document
  .getElementById('copyButton')
  .addEventListener('click', copy2);

const pasteButton2 = document
  .getElementById('pasteButton')
  .addEventListener('click', paste2);
