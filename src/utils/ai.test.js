import { describe, it, expect, vi, beforeEach } from 'vitest';

const { generateContentMock, _getGenerativeModelMock, GoogleGenerativeAIMock } = vi.hoisted(() => {
  const generateContentMock = vi.fn();
  const getGenerativeModelMock = vi.fn(() => ({
    generateContent: generateContentMock
  }));

  class GoogleGenerativeAIMock {
    constructor() {
      return {
        getGenerativeModel: getGenerativeModelMock
      };
    }
  }

  return {
    generateContentMock,
    _getGenerativeModelMock: getGenerativeModelMock,
    GoogleGenerativeAIMock
  };
});

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: GoogleGenerativeAIMock
}));

import { estimateCarbsFromImage } from './ai';

describe('estimateCarbsFromImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses a plain JSON response', async () => {
    generateContentMock.mockResolvedValue({
      response: {
        text: () => JSON.stringify({ carbs: 42, foodName: 'Pasta', reasoning: 'OK' })
      }
    });

    await expect(estimateCarbsFromImage('base64', 'image/jpeg', 'api-key')).resolves.toEqual({
      carbs: 42,
      foodName: 'Pasta'
    });
  });

  it('extracts JSON from fenced text with trailing prose', async () => {
    generateContentMock.mockResolvedValue({
      response: {
        text: () => '```json\n{"carbs":55,"foodName":"Burger","reasoning":"OK"}\n```\nHope that helps!'
      }
    });

    await expect(estimateCarbsFromImage('base64', 'image/jpeg', 'api-key')).resolves.toEqual({
      carbs: 55,
      foodName: 'Burger'
    });
  });

  it('throws a user-facing parse error for malformed responses', async () => {
    generateContentMock.mockResolvedValue({
      response: {
        text: () => 'I think this meal has about 40 carbs.'
      }
    });

    await expect(estimateCarbsFromImage('base64', 'image/jpeg', 'api-key')).rejects.toThrow(
      'Could not read AI response. Please try again.'
    );
  });
});