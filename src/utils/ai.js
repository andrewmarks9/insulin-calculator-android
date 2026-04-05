import { GoogleGenerativeAI } from '@google/generative-ai';

export async function estimateCarbsFromImage(base64Image, mimeType = 'image/jpeg', apiKey) {
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Please add it to your App Settings.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = "Analyze this image of a meal. Estimate the total carbohydrates in grams. You must reply with ONLY a single integer representing the grams of carbs. Do not provide any other text, explanation, or units.";

  const imageParts = [
    {
      inlineData: {
        data: base64Image,
        mimeType
      },
    },
  ];

  try {
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text().trim();
    
    const match = text.match(/\d+/);
    if (match) {
      return parseInt(match[0], 10);
    }
    throw new Error("Could not extract a number from the AI response.");
  } catch (error) {
    console.error("AI estimation error:", error);
    throw error;
  }
}
