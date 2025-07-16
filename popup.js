document.addEventListener('DOMContentLoaded', () => {
  const explanationContainer = document.getElementById('explanation-container');
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');

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

  // Listen for changes in storage to update the popup in real-time
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.conversation) {
      renderConversation(changes.conversation.newValue);
    }
  });

  function handleSendMessage() {
    const messageText = chatInput.value.trim();
    if (messageText) {
      // Add user message to the conversation and save it
      chrome.storage.local.get('conversation', (result) => {
        const conversation = result.conversation || [];
        const updatedConversation = [...conversation, { role: 'user', content: messageText }];
        chrome.storage.local.set({ conversation: updatedConversation });
      });
      
      chatInput.value = '';
      // The storage listener will handle rendering the new message
    }
  }

  function loadConversation() {
    chrome.storage.local.get('conversation', (result) => {
      const conversation = result.conversation || [];
      if (conversation.length === 0) {
        explanationContainer.innerHTML = '<div class="status">Highlight text on a page to start a conversation.</div>';
      } else {
        renderConversation(conversation);
      }
    });
  }

  function renderConversation(conversation) {
    explanationContainer.innerHTML = ''; // Clear existing content
    conversation.forEach(message => {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('message', message.role); // role is 'user' or 'bot'
      messageDiv.textContent = message.content;
      explanationContainer.appendChild(messageDiv);
    });

    // Scroll to the latest message
    explanationContainer.scrollTop = explanationContainer.scrollHeight;
  }
});

