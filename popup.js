document.addEventListener('DOMContentLoaded', () => {
  const explanationElement = document.getElementById('explanation');
  const statusMessage = document.getElementById('status-message');
  const clearButton = document.getElementById('clear-button');
  const defaultText = 'Highlight text on any page to get an explanation.';

  // Function to update the popup's display based on storage
  function updatePopup() {
    chrome.storage.local.get(['status', 'lastExplanation'], (result) => {
      if (result.status === 'loading') {
        statusMessage.style.display = 'block';
        explanationElement.textContent = '';
      } else {
        statusMessage.style.display = 'none';
        explanationElement.textContent = result.lastExplanation || defaultText;
      }
    });
  }

  // Update the popup as soon as it opens
  updatePopup();

  // Listen for changes in storage and update the popup in real-time
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      updatePopup();
    }
  });

  // Handle the clear button
  clearButton.addEventListener('click', () => {
    explanationElement.textContent = defaultText;
    chrome.storage.local.set({ status: 'cleared', lastExplanation: null });
  });
});
