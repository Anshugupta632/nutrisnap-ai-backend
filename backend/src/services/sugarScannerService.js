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
function parseGeminiJSON(responseText, context = 'label scan') {
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

// Hidden sugar names found in ingredient labels
const HIDDEN_SUGAR_NAMES = [
  'maltodextrin', 'dextrose', 'corn syrup', 'high fructose corn syrup',
  'sucrose', 'glucose', 'fructose', 'fruit juice concentrate',
  'invert sugar', 'malt syrup', 'rice syrup', 'cane juice',
  'molasses', 'honey', 'agave nectar', 'barley malt',
  'dextrin', 'maltose', 'galactose', 'lactose', 'corn sweetener',
];

// Mapping for healthy alternatives
const ALTERNATIVES = {
  'sweetened cereal / oats': 'Plain oats with fresh fruit for natural sweetness',
  'flavored yogurt': 'Plain curd/yogurt with honey (in moderation)',
  'packaged juice': 'Fresh homemade fruit juice or whole fruit',
  'biscuits/cookies': 'Roasted makhana or homemade oats cookies',
  default: 'Check for a "no added sugar" or "less than 5g sugar" labeled alternative',
};

async function scanIngredientLabel(filePath, mimeType) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are an OCR assistant. Extract the complete ingredients list text from this packaged food label photo exactly as written.

Response ONLY in this JSON format, no extra text:
{
  "product_name": "product name if visible",
  "ingredients_text": "complete ingredients list from photo as a single string"
}

If ingredients list is not visible or photo is unclear, keep "ingredients_text" as empty string.`;

  const imagePart = fileToGenerativePart(filePath, mimeType);

  const result = await model.generateContent([prompt, imagePart]);
  const responseText = result.response.text();

  const ocrResult = parseGeminiJSON(responseText, 'label scan');

  // Match against dictionary - this part doesn't depend on AI, so it's reliable
  const foundSugars = HIDDEN_SUGAR_NAMES.filter((sugar) =>
    ocrResult.ingredients_text.toLowerCase().includes(sugar.toLowerCase())
  );

  return {
    product_name: ocrResult.product_name || 'Unknown Product',
    ingredients_text: ocrResult.ingredients_text,
    hidden_sugars_found: foundSugars,
    has_hidden_sugar: foundSugars.length > 0,
    suggestion: foundSugars.length > 0 ? ALTERNATIVES.default : null,
  };
}

module.exports = { scanIngredientLabel };