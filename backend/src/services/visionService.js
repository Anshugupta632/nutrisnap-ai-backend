const fs = require('fs');
require('dotenv').config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const VISION_MODEL = 'meta-llama/llama-3.2-11b-vision-instruct:free';

if (!OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY missing in .env file!');
}

function fileToBase64DataUrl(filePath, mimeType) {
  const base64 = fs.readFileSync(filePath).toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Safely parses JSON from AI response
 * Throws meaningful error if malformed JSON
 */
function parseAIJSON(responseText, context = 'meal analysis') {
  const cleanedText = responseText.replace(/```json|```/g, '').trim();

  if (!cleanedText) {
    throw new Error('AI returned no response. Please try again.');
  }

  try {
    return JSON.parse(cleanedText);
  } catch (parseError) {
    console.error(`[${context}] JSON parse failed. Raw response:`, responseText);
    console.error(`[${context}] Cleaned text:`, cleanedText);
    console.error(`[${context}] Parse error:`, parseError.message);

    if (cleanedText.includes('SAFETY') || cleanedText.includes('safety') || cleanedText.includes('blocked')) {
      throw new Error('Photo content violates safety policy. Try a different photo.');
    }
    if (cleanedText.includes('quota') || cleanedText.includes('rate limit')) {
      throw new Error('AI service is busy. Please try again later.');
    }
    if (!cleanedText.startsWith('{') || !cleanedText.endsWith('}')) {
      throw new Error('AI response format is invalid. Please try again.');
    }
    throw new Error('Could not understand AI response. Please try again.');
  }
}

async function callOpenRouterVision(prompt, imageDataUrl) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('OpenRouter API error:', response.status, errText);
    if (response.status === 429) {
      throw new Error('AI service is busy. Please try again later.');
    }
    throw new Error('AI service error. Please try again.');
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('AI returned no response. Please try again.');
  }
  return text;
}

async function analyzeMealPhoto(filePath, mimeType) {
  const prompt = `You are an expert Indian nutritionist. Analyze this food photo and provide nutrition breakdown.
Response ONLY in this JSON format, no extra text or markdown backticks:
{
  "items": [
    {
      "name": "item name (e.g., Roti, Paneer Sabzi)",
      "quantity": "amount (e.g., 2 pieces, 1 bowl)",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fats": number,
      "confidence_level": "high" or "medium" or "low"
    }
  ],
  "total_calories": number,
  "total_protein": number,
  "total_carbs": number,
  "total_fats": number
}
If no food is visible or unclear, return empty items array.`;

  const imageDataUrl = fileToBase64DataUrl(filePath, mimeType);
  const responseText = await callOpenRouterVision(prompt, imageDataUrl);
  return parseAIJSON(responseText, 'meal analysis');
}

module.exports = { analyzeMealPhoto };
