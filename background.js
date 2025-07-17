// Create the context menu item when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "teach-me-explain",
    title: "Explain with Teach Me",
    contexts: ["selection"] // Only show when text is selected
  });
});

// Listen for when the user clicks on the context menu item
chrome.contextMenus.onClicked.addListener((info, tab) => {
  // Ensure the click was on our menu item and there's text selected
  if (info.menuItemId === "teach-me-explain" && info.selectionText) {
    // Send a message to the content script in the active tab,
    // telling it to start the explanation process.
    chrome.tabs.sendMessage(tab.id, {
      type: "EXPLAIN_TEXT",
      text: info.selectionText
    });
  }
});
