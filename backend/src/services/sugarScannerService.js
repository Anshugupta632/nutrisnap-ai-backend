const fs = require('fs');
require('dotenv').config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Try these free vision models in order - if one is rate-limited, fall back to the next
const VISION_MODELS = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
];

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

async function tryOneModel(model, prompt, imageDataUrl) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
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
    const error = new Error(`OpenRouter error for ${model}: ${response.status}`);
    error.status = response.status;
    error.rawBody = errText;
    throw error;
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error(`No content returned from ${model}`);
  }
  return text;
}

/**
 * Tries each model in VISION_MODELS in order.
 * Falls through to the next on 429 (rate limit) or 5xx errors.
 * Any other error (e.g. 401 bad key) stops immediately.
 */
async function callOpenRouterVision(prompt, imageDataUrl) {
  let lastError = null;

  for (const model of VISION_MODELS) {
    try {
      return await tryOneModel(model, prompt, imageDataUrl);
    } catch (err) {
      lastError = err;
      console.error(`Vision model failed: ${model}`, err.status || '', err.rawBody || err.message);

      const isRetryable = err.status === 429 || (err.status >= 500 && err.status < 600);
      if (!isRetryable) {
        break;
      }
    }
  }

  console.error('All vision models failed. Last error:', lastError?.message);
  throw new Error('AI service is busy right now. Please try again in a minute.');
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
