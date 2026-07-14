const OpenAI = require('openai');
const fs = require('fs');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

async function analyzeMealPhoto(filePath, mimeType) {
  const base64Image = fs.readFileSync(filePath).toString('base64');
  const dataUri = `data:${mimeType};base64,${base64Image}`;

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

  const response = await openai.chat.completions.create({
    model: 'google/gemma-4-26b-a4b-it:free',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: dataUri } },
        ],
      },
    ],
  });


  const responseText = response.choices[0].message.content;
  let cleanedText = responseText.replace(/```json|```/g, '').trim();

// Sirf pehle '{' se lekar last '}' tak ka content nikaalo, extra text ignore karo
const firstBrace = cleanedText.indexOf('{');
const lastBrace = cleanedText.lastIndexOf('}');

if (firstBrace === -1 || lastBrace === -1) {
  throw new Error('AI response mein valid JSON nahi mila');
}

cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);

return JSON.parse(cleanedText);
  
}

module.exports = { analyzeMealPhoto };