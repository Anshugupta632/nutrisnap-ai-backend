const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Photo ko base64 mein convert karne ka helper function
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: fs.readFileSync(filePath).toString('base64'),
      mimeType,
    },
  };
}

async function analyzeMealPhoto(filePath, mimeType) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Tum ek expert Indian nutritionist ho. Is khane ki photo ko dekho aur uska nutrition breakdown do.

  Response SIRF is JSON format mein do, koi extra text ya markdown backticks nahi:
  {
    "items": [
      {
        "name": "item ka naam (jaise: Roti, Paneer Sabzi)",
        "quantity": "kitna (jaise: 2 pieces, 1 bowl)",
        "calories": number,
        "protein": number,
        "carbs": number,
        "fats": number,
        "confidence_level": "high" ya "medium" ya "low"
      }
    ],
    "total_calories": number,
    "total_protein": number,
    "total_carbs": number,
    "total_fats": number
  }

  Agar photo mein khana nahi dikh raha ya samajh nahi aa raha, toh items ko empty array rakho.`;

  const imagePart = fileToGenerativePart(filePath, mimeType);

  const result = await model.generateContent([prompt, imagePart]);
  const responseText = result.response.text();

  // Gemini kabhi kabhi ```json ... ``` mein wrap kar deta hai, usse clean karte hain
  const cleanedText = responseText.replace(/```json|```/g, '').trim();

  return JSON.parse(cleanedText);
}

module.exports = { analyzeMealPhoto };