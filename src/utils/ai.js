import { GoogleGenerativeAI } from '@google/generative-ai';

const AI_RESPONSE_ERROR_MESSAGE = 'Could not read AI response. Please try again.';

function extractJsonText(text) {
  if (typeof text !== 'string') {
    throw new Error(AI_RESPONSE_ERROR_MESSAGE);
  }

  const trimmedText = text.trim();

  try {
    return JSON.parse(trimmedText);
  } catch {
    const firstBrace = trimmedText.indexOf('{');
    const lastBrace = trimmedText.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error(AI_RESPONSE_ERROR_MESSAGE);
    }

    try {
      return JSON.parse(trimmedText.slice(firstBrace, lastBrace + 1));
    } catch {
      throw new Error(AI_RESPONSE_ERROR_MESSAGE);
    }
  }
}

function isValidAIResponse(data) {
  return Boolean(
    data &&
    typeof data === 'object' &&
    Number.isFinite(data.carbs) &&
    typeof data.foodName === 'string' &&
    data.foodName.trim().length > 0
  );
}

export async function estimateCarbsFromImage(base64Image, mimeType = 'image/jpeg', apiKey) {
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Please add it to your App Settings.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Reverting to Flash for 15 Requests/minute limits!
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const prompt = `You are a clinical diabetes educator analyzing a meal.
1. Identify all visible food items and estimate their weight/portion sizes relative to standard plates.
2. Calculate the carbohydrates mathematically for each component based on standard USDA nutritional values.
3. Pay special attention to starchy carbohydrates (bread, pasta, rice, potatoes, corn), sweet sauces, and side dishes.

Provide a JSON object with this exact structure:
{
  "reasoning": "A step-by-step mathematical breakdown for each component.",
  "carbs": 45,
  "foodName": "Spaghetti and Meatballs"
}

Example 1:
Input image: A standard burger with bun and fries.
Output: {
  "reasoning": "Standard hamburger bun is ~30g carbs. Small basket of french fries (approx 70-80g) is ~35g carbs. Total: 65g.",
  "carbs": 65,
  "foodName": "Burger and Fries"
}

Analyze the provided image and generate the JSON output.`;

  const imageParts = [{ inlineData: { data: base64Image, mimeType } }];

  try {
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const data = extractJsonText(response.text());

    if (isValidAIResponse(data)) {
      return { carbs: data.carbs, foodName: data.foodName };
    }
    throw new Error(AI_RESPONSE_ERROR_MESSAGE);
  } catch (error) {
    console.error("AI estimation error:", error);
    if (error.message === AI_RESPONSE_ERROR_MESSAGE) {
      throw error;
    }
    throw new Error(AI_RESPONSE_ERROR_MESSAGE);
  }
}
