const OpenAI = require('openai');
const fs = require('fs');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

// Hidden sugar names jo ingredient labels mein chhupe hote hain
const HIDDEN_SUGAR_NAMES = [
  'maltodextrin', 'dextrose', 'corn syrup', 'high fructose corn syrup',
  'sucrose', 'glucose', 'fructose', 'fruit juice concentrate',
  'invert sugar', 'malt syrup', 'rice syrup', 'cane juice',
  'molasses', 'honey', 'agave nectar', 'barley malt',
  'dextrin', 'maltose', 'galactose', 'lactose', 'corn sweetener',
];

// Healthy alternatives suggest karne ke liye chhota mapping
const ALTERNATIVES = {
  'sweetened cereal / oats': 'Plain oats with fresh fruit for natural sweetness',
  'flavored yogurt': 'Plain curd/yogurt with honey (in moderation)',
  'packaged juice': 'Fresh homemade fruit juice or whole fruit',
  'biscuits/cookies': 'Roasted makhana or homemade oats cookies',
  default: 'Check for a "no added sugar" or "less than 5g sugar" labeled alternative',
};

async function scanIngredientLabel(filePath, mimeType) {
  const base64Image = fs.readFileSync(filePath).toString('base64');
  const dataUri = `data:${mimeType};base64,${base64Image}`;

  const prompt = `Tum ek OCR assistant ho. Is packaged food label ki photo se saara ingredients list text ko exactly nikalo jaisa likha hai.

  Response SIRF is JSON format mein do, koi extra text nahi:
  {
    "product_name": "agar dikhe toh product ka naam",
    "ingredients_text": "poora ingredients list jo photo mein dikha, ek single string mein"
  }

  Agar ingredients list nahi dikh rahi ya photo unclear hai, "ingredients_text" ko empty string rakho.`;

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
  const firstBrace = cleanedText.indexOf('{');
  const lastBrace = cleanedText.lastIndexOf('}');
  cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);

  const ocrResult = JSON.parse(cleanedText);

  // Ab dictionary se match karo - yeh part AI pe depend nahi karta, isliye reliable hai
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