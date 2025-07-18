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

  function handleSendMessage() {
    const messageText = chatInput.value.trim();
    if (messageText) {
      chrome.storage.local.get('conversation', (result) => {
        const conversation = result.conversation || [];
        const updatedConversation = [...conversation, { role: 'user', content: messageText }];
        chrome.storage.local.set({ conversation: updatedConversation });
      });
      chatInput.value = '';
    }
  }

  function loadConversation() {
    chrome.storage.local.get('conversation', (result) => {
      renderConversation(result.conversation);
    });
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

