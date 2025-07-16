document.addEventListener('DOMContentLoaded', () => {
  const explanationElement = document.getElementById('explanation');
  const statusMessage = document.getElementById('status-message');
  const clearButton = document.getElementById('clear-button');
  const defaultText = 'Highlight text on any page to get an explanation.';

  // Function to load the last explanation from storage
  function loadExplanation() {
    chrome.storage.local.get(['lastExplanation'], (result) => {
      explanationElement.textContent = result.lastExplanation || defaultText;
    });
  }

  // Load the explanation as soon as the popup opens
  loadExplanation();

  // Listen for real-time updates
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'loading') {
      statusMessage.style.display = 'block';
      explanationElement.textContent = '';
    } else if (request.action === 'explanation_ready') {
      statusMessage.style.display = 'none';
      explanationElement.textContent = request.explanation;
    }
  });

  // Handle the clear button
  clearButton.addEventListener('click', () => {
    explanationElement.textContent = defaultText;
    chrome.storage.local.remove('lastExplanation');
  });
});
