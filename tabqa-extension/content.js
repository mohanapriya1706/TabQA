console.log("TabQA content script loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GET_PAGE_TEXT") {
    const pageText = document.body.innerText;
    sendResponse({ text: pageText });
  }
});
