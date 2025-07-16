document.addEventListener('mouseup', async (e) => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText) {
    // Set a "loading" state in storage so the popup can show it.
    chrome.storage.local.set({ status: 'loading', lastExplanation: null });

    const surroundingText = getSurroundingText(selection);
    const explanation = await getExplanation(selectedText, surroundingText);

    // Save the final explanation to local storage
    chrome.storage.local.set({ status: 'ready', lastExplanation: explanation });

    // Clear the selection
    window.getSelection().removeAllRanges();
  }
});

function getSurroundingText(selection) {
  if (!selection.anchorNode) {
    return '';
  }

  // Strategy 1: Look for PDF.js viewer structure first
  const pageElement = selection.anchorNode.parentElement.closest('.page');
  if (pageElement) {
    const textLayer = pageElement.querySelector('.textLayer');
    if (textLayer) {
      console.log("Found PDF.js text layer for context.");
      return textLayer.innerText;
    }
  }

  // Strategy 2: Find the closest common block-level ancestor for regular pages
  console.log("No PDF.js structure found. Searching for common ancestor.");
  let surroundingText = '';
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;

    let container = commonAncestor.nodeType === Node.ELEMENT_NODE ? commonAncestor : commonAncestor.parentElement;
    while (container) {
      const style = window.getComputedStyle(container);
      if (style.display === 'block' || container.tagName === 'P' || container.tagName === 'DIV' || container.tagName === 'ARTICLE' || container.tagName === 'SECTION') {
        surroundingText = container.innerText;
        break;
      }
      container = container.parentElement;
    }
  }
  
  return surroundingText;
}

async function getExplanation(highlightedText, surroundingText) {
  try {
    const response = await fetch('https://teach-me-app-sigma.vercel.app/api/explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        highlightedText,
        surroundingText,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.explanation;
  } catch (error) {
    console.error('Error getting explanation:', error);
    return 'Sorry, I was unable to get an explanation for that.';
  }
}
