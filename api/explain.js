require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { highlightedText, surroundingText, chatHistory } = req.body;

    if (!highlightedText) {
      return res.status(400).send('Missing required field: highlightedText');
    }

    let prompt;
    if (chatHistory && chatHistory.length > 0) {
      // Format conversation history as readable text
      const historyText = chatHistory.map(msg =>
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n\n');

      prompt = `You are Teach Me, an expert educator AI continuing a conversation.

ORIGINAL TOPIC: "${highlightedText}"
CONTEXT: ${surroundingText || "Not provided."}

CONVERSATION SO FAR:
${historyText}

INSTRUCTIONS:
- Answer the user's latest question directly and helpfully
- Keep the response concise but thorough
- Use **bold** for key terms
- Be friendly and encouraging
- Do NOT include any JSON formatting, just provide your explanation as plain text`;

    } else {
      prompt = `You are Teach Me, an expert educator AI.

A user has highlighted this text they want to understand:
"${highlightedText}"

SURROUNDING CONTEXT: ${surroundingText || "Not provided."}

INSTRUCTIONS:
- Provide a clear, concise explanation assuming a beginner audience
- Use **bold** for key terms
- Be friendly and encouraging
- Do NOT include any JSON formatting, just provide your explanation as plain text`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const explanation = response.text().trim();

    res.status(200).json({ explanation });

  } catch (error) {
    console.error('Error generating explanation:', error.message);
    res.status(500).json({ error: error.message || 'Error generating explanation' });
  }
};
