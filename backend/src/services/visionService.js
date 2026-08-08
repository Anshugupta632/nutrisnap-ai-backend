const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY missing in .env file!');
}

function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: fs.readFileSync(filePath).toString('base64'),
      mimeType,
    },
  };
}

/**
 * Safely parses JSON from Gemini response
 * Throws meaningful error if malformed JSON
 */
function parseGeminiJSON(responseText, context = 'meal analysis') {
  const cleanedText = responseText.replace(/```json|```/g, '').trim();

  if (!cleanedText) {
    throw new Error('AI returned no response. Please try again.');
  }

  try {
    return JSON.parse(cleanedText);
  } catch (parseError) {
    // Log raw response for debugging
    console.error(`[${context}] JSON parse failed. Raw response:`, responseText);
    console.error(`[${context}] Cleaned text:`, cleanedText);
    console.error(`[${context}] Parse error:`, parseError.message);

    // Detect common issues
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

async function analyzeMealPhoto(filePath, mimeType) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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

  const imagePart = fileToGenerativePart(filePath, mimeType);

  const result = await model.generateContent([prompt, imagePart]);
  const responseText = result.response.text();

  return parseGeminiJSON(responseText, 'meal analysis');
}

module.exports = { analyzeMealPhoto };