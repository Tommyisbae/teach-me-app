document.addEventListener('mouseup', async (e) => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText) {
    const surroundingText = getSurroundingText(selection);
    
    // Get the current conversation, add a loading message, and save.
    chrome.storage.local.get('conversation', async (result) => {
      const conversation = result.conversation || [];
      const updatedConversation = [
        ...conversation,
        { role: 'bot', content: `Thinking about "${selectedText}"...` }
      ];
      chrome.storage.local.set({ conversation: updatedConversation });

      // Fetch the explanation
      const explanation = await getExplanation(selectedText, surroundingText);

      // Replace the loading message with the actual explanation
      updatedConversation.pop(); // Remove the "Thinking..." message
      const finalConversation = [
        ...updatedConversation,
        { role: 'bot', content: `Here's an explanation of "${selectedText}":\n\n${explanation}` }
      ];

      // Save the final conversation and the context
      chrome.storage.local.set({ 
        conversation: finalConversation,
        originalContext: { // We still save the latest context
          highlightedText: selectedText,
          surroundingText: surroundingText
        }
      });
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
  try {
    const response = await fetch('https://teach-me-app-sigma.vercel.app/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ highlightedText, surroundingText }), // No chat history needed for the initial explanation
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

    // Check if the last message was from the user, indicating a follow-up
    if (newConversation.length > oldConversation.length && newConversation[newConversation.length - 1].role === 'user') {
      handleFollowUp(newConversation);
    }
  }
});

async function handleFollowUp(conversation) {
  try {
    // Add a "Thinking..." message while waiting for the response
    const thinkingConversation = [...conversation, { role: 'bot', content: 'Thinking...' }];
    chrome.storage.local.set({ conversation: thinkingConversation });

    chrome.storage.local.get('originalContext', async (result) => {
      // Use the full conversation history for context
      const response = await fetch('https://teach-me-app-sigma.vercel.app/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // We can send the whole history, the backend will handle it
          chatHistory: conversation,
          // Send the original context in case it's useful
          highlightedText: result.originalContext?.highlightedText || '',
          surroundingText: result.originalContext?.surroundingText || ''
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Replace "Thinking..." with the actual response
      const finalConversation = [...conversation, { role: 'bot', content: data.explanation }];
      chrome.storage.local.set({ conversation: finalConversation });
    });
  } catch (error) {
    console.error('Error getting follow-up explanation:', error);
    const finalConversation = [...conversation, { role: 'bot', content: 'Sorry, I encountered an error.' }];
    chrome.storage.local.set({ conversation: finalConversation });
  }
}
