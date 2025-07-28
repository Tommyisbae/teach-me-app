document.addEventListener('DOMContentLoaded', () => {
  const explanationContainer = document.getElementById('explanation-container');
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const clearButton = document.getElementById('clear-button');
  const initialMessage = '<div class="status">Highlight text on a page to start a conversation.</div>';

  // Load and render the conversation history
  loadConversation();

  // Listen for send button clicks
  sendButton.addEventListener('click', handleSendMessage);

  // Listen for "Enter" key in the input field
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  });

  // Listen for clear button clicks
  clearButton.addEventListener('click', () => {
    chrome.storage.local.set({ conversation: [], originalContext: null });
  });

  // Listen for changes in storage to update the popup in real-time
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.conversation) {
      renderConversation(changes.conversation.newValue);
    }
  });

  async function handleSendMessage() {
    const messageText = chatInput.value.trim();
    if (!messageText) return;

    chatInput.value = '';
    chatInput.disabled = true;
    sendButton.disabled = true;

    // Get the state at the beginning
    const { conversation: currentConversation = [], originalContext } = await chrome.storage.local.get(['conversation', 'originalContext']);
    const conversationWithUserMsg = [...currentConversation, { role: 'user', content: messageText }];

    try {
      // Add "Thinking..." message and update storage/UI
      const thinkingConversation = [...conversationWithUserMsg, { role: 'bot', content: 'Thinking...' }];
      await chrome.storage.local.set({ conversation: thinkingConversation });

      // Make the API call
      const explanation = await getFollowUpExplanation(conversationWithUserMsg, originalContext);

      // Replace "Thinking..." with the actual response
      const finalConversation = [...conversationWithUserMsg, { role: 'bot', content: explanation }];
      await chrome.storage.local.set({ conversation: finalConversation });

    } catch (error) {
      console.error('Error getting follow-up explanation:', error);
      // Replace "Thinking..." with an error message
      const errorConversation = [...conversationWithUserMsg, { role: 'bot', content: 'Sorry, I encountered an error.' }];
      await chrome.storage.local.set({ conversation: errorConversation });
    } finally {
      // Re-enable input
      chatInput.disabled = false;
      sendButton.disabled = false;
      chatInput.focus();
    }
  }

  async function getFollowUpExplanation(chatHistory, originalContext) {
    let retries = 2; // Attempt a total of 2 times
    while (retries > 0) {
      try {
        const response = await fetch('https://teach-me-app-sigma.vercel.app/api/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatHistory: chatHistory,
            highlightedText: originalContext?.highlightedText || '',
            surroundingText: originalContext?.surroundingText || ''
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.explanation;
      } catch (error) {
        retries--;
        if (retries === 0) {
          console.error('Error getting follow-up explanation after multiple retries:', error);
          throw error; // Rethrow to be caught by handleSendMessage
        }
        console.warn('Retrying follow-up fetch...', error);
      }
    }
  }

  async function loadConversation() {
    const { conversation } = await chrome.storage.local.get('conversation');
    renderConversation(conversation);
  }

  function renderConversation(conversation) {
    explanationContainer.innerHTML = ''; // Clear existing content
    if (!conversation || conversation.length === 0) {
      explanationContainer.innerHTML = initialMessage;
      return;
    }
    
    conversation.forEach(message => {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('message', message.role);
      // Replace **text** with <strong>text</strong> for basic markdown bolding
      const formattedContent = message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      messageDiv.innerHTML = formattedContent; // Use innerHTML to render the bold tags
      explanationContainer.appendChild(messageDiv);
    });

    explanationContainer.scrollTop = explanationContainer.scrollHeight;
  }
});