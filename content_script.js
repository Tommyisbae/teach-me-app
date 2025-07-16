document.addEventListener('mouseup', async (e) => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText) {
    // Clear previous conversation and set a loading state
    const loadingConversation = [{ role: 'bot', content: 'Loading...' }];
    chrome.storage.local.set({ conversation: loadingConversation });

    const surroundingText = getSurroundingText(selection);
    
    // Fetch the initial explanation
    const explanation = await getExplanation(selectedText, surroundingText);

    // Create the initial conversation history
    const conversation = [
      { role: 'bot', content: `Here's an explanation of "${selectedText}":\n\n${explanation}` }
    ];

    // Save the full conversation to local storage
    chrome.storage.local.set({ 
      conversation: conversation,
      originalContext: {
        highlightedText: selectedText,
        surroundingText: surroundingText
      }
    });

    // Clear the selection on the page
    window.getSelection().removeAllRanges();
  }
});

function getSurroundingText(selection) {
  if (!selection.anchorNode) return '';

  const pageElement = selection.anchorNode.parentElement.closest('.page');
  if (pageElement && pageElement.querySelector('.textLayer')) {
    return pageElement.querySelector('.textLayer').innerText;
  }

  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;
    let container = commonAncestor.nodeType === Node.ELEMENT_NODE ? commonAncestor : commonAncestor.parentElement;
    while (container) {
      const style = window.getComputedStyle(container);
      if (style.display === 'block' || ['P', 'DIV', 'ARTICLE', 'SECTION'].includes(container.tagName)) {
        return container.innerText;
      }
      container = container.parentElement;
    }
  }
  
  return '';
}

async function getExplanation(highlightedText, surroundingText) {
  // This function now just fetches the initial explanation.
  // The popup will handle subsequent chat messages.
  try {
    const response = await fetch('https://teach-me-app-sigma.vercel.app/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ highlightedText, surroundingText }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.explanation;
  } catch (error) {
    console.error('Error getting initial explanation:', error);
    return 'Sorry, I was unable to get an explanation for that.';
  }
}

// This listener handles follow-up questions from the popup
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.conversation) {
    const newConversation = changes.conversation.newValue;
    const oldConversation = changes.conversation.oldValue || [];

    // Check if the last message was from the user
    if (newConversation.length > oldConversation.length && newConversation[newConversation.length - 1].role === 'user') {
      handleFollowUp(newConversation);
    }
  }
});

async function handleFollowUp(conversation) {
  try {
    chrome.storage.local.get('originalContext', async (result) => {
      const { highlightedText, surroundingText } = result.originalContext;
      
      const response = await fetch('https://teach-me-app-sigma.vercel.app/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          highlightedText,
          surroundingText,
          chatHistory: conversation,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add the bot's response to the conversation
      const updatedConversation = [...conversation, { role: 'bot', content: data.explanation }];
      chrome.storage.local.set({ conversation: updatedConversation });
    });
  } catch (error) {
    console.error('Error getting follow-up explanation:', error);
    const updatedConversation = [...conversation, { role: 'bot', content: 'Sorry, I encountered an error.' }];
    chrome.storage.local.set({ conversation: updatedConversation });
  }
}
