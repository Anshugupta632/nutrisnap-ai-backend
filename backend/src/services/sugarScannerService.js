const fs = require('fs');
require('dotenv').config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const VISION_MODEL = 'google/gemma-4-31b-it:free';

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
function parseAIJSON(responseText, context = 'label scan') {
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
  const prompt = `You are an OCR assistant. Extract the complete ingredients list text from this packaged food label photo exactly as written.

Response ONLY in this JSON format, no extra text:
{
  "product_name": "product name if visible",
  "ingredients_text": "complete ingredients list from photo as a single string"
}

If ingredients list is not visible or photo is unclear, keep "ingredients_text" as empty string.`;

  const imageDataUrl = fileToBase64DataUrl(filePath, mimeType);
  const responseText = await callOpenRouterVision(prompt, imageDataUrl);

  const ocrResult = parseAIJSON(responseText, 'label scan');

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
