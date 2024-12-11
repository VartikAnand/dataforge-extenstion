chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    if (tab.url.includes('linkedin.com/in/')) {
      console.log('LinkedIn profile opened:', tab.url);
      // You can perform additional actions here, such as sending a message to the content script
    }
  });
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "STORE_TOKEN") {
    const token = message.token;

    // Store the token in chrome.storage.local
    chrome.storage.local.set({ accessToken: token }, () => {
      console.log("Access token stored in chrome.storage.local");
      sendResponse({ status: "success" });
    });

    // Return true to indicate you're sending a response asynchronously
    return true;
  }
});
