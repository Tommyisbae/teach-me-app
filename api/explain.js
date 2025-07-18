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
      const historyString = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n');
      prompt = `You are Teach Me, an expert educator AI, continuing a conversation with a user. They are asking a follow-up question.\n\n**Original Topic:**\n- **User's Highlight:** "${highlightedText}"\n${surroundingText ? `- **Surrounding Text:**\n"""\n${surroundingText}\n"""` : ''}\n\n**Full Conversation History (for context):**\n${historyString}\n\n**Your Mission:**\n1.  **Analyze the Latest Question:** Understand the user's latest message in the context of the entire conversation.\n2.  **Provide a Helpful Answer:** Give a concise, clear, and helpful response that directly addresses their question.\n3.  **Maintain Context:** Refer back to the original topic or previous parts of the conversation if it helps clarify your point. Do not repeat yourself unless necessary.\n4.  **Be Conversational:** Keep the tone friendly, encouraging, and helpful.\n\n**Output Format:**\nRespond with a single, valid JSON object with one key: "explanation". The explanation should be a string.`;
    } else {
      // This is the first explanation
      prompt = `You are Teach Me, an expert educator AI. Your specialty is breaking down complex concepts into simple, easy-to-understand explanations. A user has highlighted something they want to understand better.\n\n**User's Highlight:**\n"${highlightedText}"\n\n${surroundingText ? `**Surrounding Context from the Page:**\n"""\n${surroundingText}\n"""` : ''}\n\n**Your Mission:**\n1.  **Analyze:** Carefully examine the highlighted text and its surrounding context to grasp the core concept.\n2.  **Explain Simply:** Provide a clear and concise explanation. Assume you're teaching a curious beginner. Use analogies, real-world examples, or simple metaphors to make the idea click.\n3.  **Define Key Terms:** Bold any key terms within your explanation for emphasis.\n4.  **Structure:** Keep your explanation focused and to the point.\n\n**Output Format:**\nRespond with a single, valid JSON object with one key: "explanation". The explanation should be a string.`;
    }

    const result = await model.generateContent(prompt);
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
