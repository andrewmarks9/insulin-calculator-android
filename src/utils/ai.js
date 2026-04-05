import { GoogleGenerativeAI } from '@google/generative-ai';

export async function estimateCarbsFromImage(base64Image, mimeType = 'image/jpeg', apiKey) {
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Please add it to your App Settings.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

  const prompt = `You are an expert nutritionist and diabetes educator analyzing a meal.
1. Carefully identify all visible food items and estimate their portion sizes relative to standard plates/bowls.
2. Pay special attention to starchy carbohydrates (bread, pasta, rice, potatoes, corn), sweet sauces, and side dishes.
3. Mentally calculate the carbohydrates for each distinct component.

Return a JSON object with exactly three keys:
1. "reasoning": A brief 1-2 sentence breakdown of your carb estimation per ingredient.
2. "carbs": A single integer representing your final, highly accurate estimate of the total carbohydrates in grams.
3. "foodName": A short 1-4 word description of the main food items.

Do not provide any text or markdown outside the JSON block.`;

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
