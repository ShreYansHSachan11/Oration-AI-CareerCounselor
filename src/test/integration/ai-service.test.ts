import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService } from '@/server/services/ai';
import { TRPCError } from '@trpc/server';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })),
  };
});

describe('AI Service Integration Tests', () => {
  let mockOpenAI: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Get the mocked OpenAI instance
    const OpenAI = await import('openai');
    mockOpenAI = new OpenAI.default();
  });

  describe('Message Validation', () => {
    it('should validate appropriate messages', () => {
      const validMessages = [
        'I need help with my career',
        'What skills should I develop?',
        'How do I negotiate salary?',
        'Career change advice needed',
      ];

      validMessages.forEach(message => {
        const result = AIService.validateMessage(message);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject inappropriate content', () => {
      const inappropriateMessages = [
        '', // Empty
        '   ', // Whitespace only
        'a'.repeat(5000), // Too long
      ];

      inappropriateMessages.forEach(message => {
        const result = AIService.validateMessage(message);
        expect(result.isValid).toBe(false);
        expect(result.reason).toBeDefined();
      });
    });

    it('should handle edge cases in validation', () => {
      const edgeCases = [
        'A', // Very short but valid
        'Career advice with special chars: @#$%^&*()',
        'Multi\nline\nmessage\nabout\ncareers',
        'Message with numbers 123 and symbols !@#',
      ];

      edgeCases.forEach(message => {
        const result = AIService.validateMessage(message);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('AI Response Generation', () => {
    it('should generate appropriate career advice', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content:
                'Based on your question about career development, I recommend focusing on building both technical and soft skills...',
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const conversation = [
        { role: 'user' as const, content: 'How can I advance my career?' },
      ];

      const result = await AIService.generateResponse(conversation);

      expect(result).toBe(mockResponse.choices[0].message.content);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('career counselor'),
          }),
          expect.objectContaining({
            role: 'user',
            content: 'How can I advance my career?',
          }),
        ]),
        max_tokens: 1000,
        temperature: 0.7,
      });
    });

    it('should handle conversation context properly', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content:
                'Following up on our previous discussion about software engineering...',
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const conversation = [
        {
          role: 'user' as const,
          content: 'I want to become a software engineer',
        },
        {
          role: 'assistant' as const,
          content:
            'Great choice! Software engineering offers many opportunities...',
        },
        {
          role: 'user' as const,
          content: 'What programming languages should I learn?',
        },
      ];

      const result = await AIService.generateResponse(conversation);

      expect(result).toBe(mockResponse.choices[0].message.content);

      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0];
      expect(callArgs.messages).toHaveLength(4); // System + 3 conversation messages
    });

    it('should limit conversation history length', async () => {
      const mockResponse = {
        choices: [
          {
            message: { content: 'Response to long conversation' },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      // Create a very long conversation
      const longConversation = [];
      for (let i = 0; i < 50; i++) {
        longConversation.push(
          { role: 'user' as const, content: `Message ${i}` },
          { role: 'assistant' as const, content: `Response ${i}` }
        );
      }

      await AIService.generateResponse(longConversation);

      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0];
      // Should limit to reasonable number of messages (system + limited history)
      expect(callArgs.messages.length).toBeLessThan(25);
    });
  });

  describe('Session Title Generation', () => {
    it('should generate appropriate session titles', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Career Development Discussion',
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await AIService.generateSessionTitle(
        'I need help planning my career path in technology'
      );

      expect(result).toBe('Career Development Discussion');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('concise title'),
          }),
        ]),
        max_tokens: 50,
        temperature: 0.5,
      });
    });

    it('should handle long titles by truncating', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content:
                'This is a very long title that exceeds the maximum length limit and should be truncated appropriately',
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await AIService.generateSessionTitle('Test message');

      expect(result.length).toBeLessThanOrEqual(100);
    });

    it('should fallback to default title on error', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('API Error')
      );

      const result = await AIService.generateSessionTitle('Test message');

      expect(result).toBe('Career Chat');
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API errors appropriately', async () => {
      const apiError = new Error('API Error');
      apiError.name = 'APIError';
      (apiError as any).status = 429;

      mockOpenAI.chat.completions.create.mockRejectedValue(apiError);

      await expect(
        AIService.generateResponse([{ role: 'user', content: 'Test' }])
      ).rejects.toThrow(TRPCError);
    });

    it('should handle rate limiting', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'APIError';
      (rateLimitError as any).status = 429;

      mockOpenAI.chat.completions.create.mockRejectedValue(rateLimitError);

      await expect(
        AIService.generateResponse([{ role: 'user', content: 'Test' }])
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Invalid API key');
      authError.name = 'APIError';
      (authError as any).status = 401;

      mockOpenAI.chat.completions.create.mockRejectedValue(authError);

      await expect(
        AIService.generateResponse([{ role: 'user', content: 'Test' }])
      ).rejects.toThrow('Invalid API key');
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';

      mockOpenAI.chat.completions.create.mockRejectedValue(timeoutError);

      await expect(
        AIService.generateResponse([{ role: 'user', content: 'Test' }])
      ).rejects.toThrow('Request timeout');
    });

    it('should handle empty or invalid responses', async () => {
      const invalidResponses = [
        { choices: [] },
        { choices: [{ message: null }] },
        { choices: [{ message: { content: '' } }] },
        null,
        undefined,
      ];

      for (const response of invalidResponses) {
        mockOpenAI.chat.completions.create.mockResolvedValue(response);

        await expect(
          AIService.generateResponse([{ role: 'user', content: 'Test' }])
        ).rejects.toThrow('No response generated');
      }
    });
  });

  describe('Content Safety', () => {
    it('should handle content filtering', async () => {
      const filteredResponse = {
        choices: [
          {
            message: {
              content: null,
            },
            finish_reason: 'content_filter',
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(filteredResponse);

      await expect(
        AIService.generateResponse([{ role: 'user', content: 'Test' }])
      ).rejects.toThrow('Content filtered');
    });

    it('should validate response content appropriateness', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content:
                'I can help you with your career questions. What specific area would you like to discuss?',
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await AIService.generateResponse([
        { role: 'user', content: 'I need career advice' },
      ]);

      expect(result).toContain('career');
      expect(result.length).toBeGreaterThan(10);
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent requests', async () => {
      const mockResponse = {
        choices: [
          {
            message: { content: 'Concurrent response' },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const requests = Array.from({ length: 5 }, (_, i) =>
        AIService.generateResponse([{ role: 'user', content: `Request ${i}` }])
      );

      const results = await Promise.all(requests);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBe('Concurrent response');
      });
    });

    it('should maintain response quality under load', async () => {
      const responses = [
        'Quality response 1 about career development',
        'Quality response 2 about skill building',
        'Quality response 3 about job searching',
      ];

      let callCount = 0;
      mockOpenAI.chat.completions.create.mockImplementation(() => {
        const response = responses[callCount % responses.length];
        callCount++;
        return Promise.resolve({
          choices: [{ message: { content: response } }],
        });
      });

      const requests = Array.from({ length: 10 }, (_, i) =>
        AIService.generateResponse([
          { role: 'user', content: `Career question ${i}` },
        ])
      );

      const results = await Promise.all(requests);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toMatch(/career|skill|job/i);
        expect(result.length).toBeGreaterThan(20);
      });
    });
  });
});
