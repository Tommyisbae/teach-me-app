document.addEventListener('mouseup', async (e) => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText) {
    const surroundingText = getSurroundingText(selection);
    
    // Clear the selection on the page immediately
    window.getSelection().removeAllRanges();

    try {
      // Get the current conversation
      const { conversation: currentConversation = [] } = await chrome.storage.local.get('conversation');
      
      // Add a loading message and save
      const loadingConversation = [
        ...currentConversation,
        { role: 'bot', content: `Thinking about "${selectedText}"...` }
      ];
      await chrome.storage.local.set({ conversation: loadingConversation });

      // Fetch the explanation
      const explanation = await getExplanation(selectedText, surroundingText);

      // Replace the loading message with the actual explanation
      loadingConversation.pop(); // Remove the "Thinking..." message
      const finalConversation = [
        ...loadingConversation,
        { role: 'bot', content: explanation }
      ];

      // Save the final conversation and the context
      await chrome.storage.local.set({ 
        conversation: finalConversation,
        originalContext: {
          highlightedText: selectedText,
          surroundingText: surroundingText
        }
      });

    } catch (error) {
      console.error("Error handling highlight:", error);
      // Optionally, you could try to revert the conversation to its previous state
    }
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

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.conversation) {
    const newConversation = changes.conversation.newValue;
    const oldConversation = changes.conversation.oldValue || [];

    if (newConversation.length > oldConversation.length && newConversation[newConversation.length - 1].role === 'user') {
      handleFollowUp(newConversation);
    }
  }
});

async function handleFollowUp(conversation) {
  try {
    const thinkingConversation = [...conversation, { role: 'bot', content: 'Thinking...' }];
    await chrome.storage.local.set({ conversation: thinkingConversation });

    const { originalContext } = await chrome.storage.local.get('originalContext');
      
    const response = await fetch('https://teach-me-app-sigma.vercel.app/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatHistory: conversation,
        highlightedText: originalContext?.highlightedText || '',
        surroundingText: originalContext?.surroundingText || ''
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    const finalConversation = [...conversation, { role: 'bot', content: data.explanation }];
    await chrome.storage.local.set({ conversation: finalConversation });

  } catch (error) {
    console.error('Error getting follow-up explanation:', error);
    const errorConversation = [...conversation, { role: 'bot', content: 'Sorry, I encountered an error.' }];
    await chrome.storage.local.set({ conversation: errorConversation });
  }
}
