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
      // This is a follow-up question
      prompt = {
        role: "You are Teach Me, an expert educator AI, continuing a conversation.",
        task: "The user is asking a follow-up question.",
        context: {
          original_topic: {
            highlighted_text: highlightedText,
            surrounding_text: surroundingText || "Not provided."
          },
          conversation_history: chatHistory
        },
        mission: [
          "Analyze the latest question in the context of the entire conversation.",
          "Provide a concise, clear, and helpful response that directly addresses the question.",
          "Maintain context by referring to the original topic or previous parts of the conversation if helpful.",
          "Keep the tone friendly, encouraging, and helpful."
        ],
        output_format: {
          type: "JSON",
          schema: { "explanation": "string" }
        }
      };
    } else {
      // This is the first explanation
      prompt = {
        role: "You are Teach Me, an expert educator AI specializing in breaking down complex concepts.",
        task: "A user has highlighted text they want to understand.",
        input: {
          highlighted_text: highlightedText,
          surrounding_context: surroundingText || "Not provided."
        },
        mission: [
          "Analyze the highlighted text and its context to grasp the core concept.",
          "Provide a clear, direct, and concise explanation, assuming a beginner audience.",
          "Bold any key terms within your explanation for emphasis.",
          "Keep the explanation focused and to the point."
        ],
        output_format: {
          type: "JSON",
          schema: { "explanation": "string" }
        }
      };
    }

    const result = await model.generateContent(JSON.stringify(prompt));
    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json\n?|\n?```/g, '');
    const parsedResponse = JSON.parse(cleanedText);

    res.status(200).json(parsedResponse);

  } catch (error) {
    console.error('Error generating explanation:', error);
    res.status(500).send('Error generating explanation.');
  }
};
