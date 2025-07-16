const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.post('/explain', async (req, res) => {
  try {
    const { highlightedText, surroundingText } = req.body;

    if (!highlightedText) {
      return res.status(400).send('Missing required field: highlightedText');
    }

    const prompt = `You are an expert educator. A user has highlighted a concept they are struggling with. Your task is to provide a clear, concise, and easy-to-understand explanation of the concept.

**Provided Information:**
- **User's Highlight:** "${highlightedText}"
${surroundingText ? `- **Surrounding Context:**\n"""\n${surroundingText}\n"""` : ''}

**Your Task:**
1.  **Identify the Core Concept:** Analyze the user's highlight and the surrounding context to understand the core idea.
2.  **Generate a Simple Explanation:** Explain the concept in simple terms, as if you were teaching it to a beginner. Use analogies or examples if helpful.
3.  **Keep it Concise:** The explanation should be a few sentences long, easy to read in a small popup.

**Output:**
Respond with a single, valid JSON object with one key: "explanation".`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json\n?|\n?```/g, '');
    const parsedResponse = JSON.parse(cleanedText);

    res.status(200).send(parsedResponse);

  } catch (error) {
    console.error('Error generating explanation:', error);
    res.status(500).send('Error generating explanation.');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
