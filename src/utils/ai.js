import { GoogleGenerativeAI } from '@google/generative-ai';

export async function estimateCarbsFromImage(base64Image, mimeType = 'image/jpeg', apiKey) {
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Please add it to your App Settings.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Analyze this image of a meal. Return a JSON object with exactly two keys:
1. "carbs": an integer estimating the total carbohydrates in grams.
2. "foodName": a short 1-4 word description of the main food item.
Do not provide any other text or markdown formatting outside the JSON block.`;

  const imageParts = [{ inlineData: { data: base64Image, mimeType } }];

  try {
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    let text = response.text().trim();
    
    // Remove markdown code blocks if the AI includes them
    if (text.startsWith('```json')) {
      text = text.slice(7, -3).trim();
    } else if (text.startsWith('```')) {
      text = text.slice(3, -3).trim();
    }

    const data = JSON.parse(text);
    if (typeof data.carbs === 'number' && data.foodName) {
      return { carbs: data.carbs, foodName: data.foodName };
    }
    throw new Error('Invalid JSON structure returned by AI');
  } catch (error) {
    console.error("AI estimation error:", error);
    throw error;
  }
}
