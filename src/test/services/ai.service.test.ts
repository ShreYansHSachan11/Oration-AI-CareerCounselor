import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService } from '@/server/services/ai';
import OpenAI from 'openai';

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

describe('AIService', () => {
  let mockOpenAI: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    };
    vi.mocked(OpenAI).mockReturnValue(mockOpenAI);
  });

  describe('generateResponse', () => {
    it('should generate AI response for career counseling', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content:
                "I'd be happy to help you with your career goals. What specific area would you like to explore?",
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const conversationHistory = [
        { role: 'user' as const, content: 'I need help with my career path' },
      ];

      const result = await AIService.generateResponse(conversationHistory);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('career counselor'),
          },
          ...conversationHistory,
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      expect(result).toBe(
        "I'd be happy to help you with your career goals. What specific area would you like to explore?"
      );
    });

    it('should handle empty conversation history', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content:
                "Hello! I'm here to help you with your career questions. How can I assist you today?",
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await AIService.generateResponse([]);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
      expect(result).toBe(
        "Hello! I'm here to help you with your career questions. How can I assist you today?"
      );
    });

    it('should handle API errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const conversationHistory = [
        { role: 'user' as const, content: 'Help me with my resume' },
      ];

      await expect(
        AIService.generateResponse(conversationHistory)
      ).rejects.toThrow('API rate limit exceeded');
    });

    it('should handle missing response content', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const conversationHistory = [
        { role: 'user' as const, content: 'Test message' },
      ];

      await expect(
        AIService.generateResponse(conversationHistory)
      ).rejects.toThrow('No response generated');
    });

    it('should handle empty choices array', async () => {
      const mockResponse = {
        choices: [],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const conversationHistory = [
        { role: 'user' as const, content: 'Test message' },
      ];

      await expect(
        AIService.generateResponse(conversationHistory)
      ).rejects.toThrow('No response generated');
    });
  });

  describe('generateSessionTitle', () => {
    it('should generate appropriate session title', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Career Path Guidance',
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const firstMessage =
        "I'm confused about which career path to choose after graduation";

      const result = await AIService.generateSessionTitle(firstMessage);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('Generate a concise title'),
          },
          {
            role: 'user',
            content: firstMessage,
          },
        ],
        max_tokens: 50,
        temperature: 0.5,
      });

      expect(result).toBe('Career Path Guidance');
    });

    it('should handle long titles by truncating', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content:
                'This is a very long title that exceeds the maximum length allowed for session titles and should be truncated',
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await AIService.generateSessionTitle(
        'Long message about career'
      );

      expect(result.length).toBeLessThanOrEqual(100);
    });

    it('should fallback to default title on API error', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('API error')
      );

      const result = await AIService.generateSessionTitle('Test message');

      expect(result).toBe('Career Chat');
    });
  });

  describe('validateMessage', () => {
    it('should validate normal messages', () => {
      const result = AIService.validateMessage('I need help with my career');

      expect(result).toEqual({
        isValid: true,
        reason: null,
      });
    });

    it('should reject empty messages', () => {
      const result = AIService.validateMessage('');

      expect(result).toEqual({
        isValid: false,
        reason: 'Message cannot be empty',
      });
    });

    it('should reject whitespace-only messages', () => {
      const result = AIService.validateMessage('   \n\t   ');

      expect(result).toEqual({
        isValid: false,
        reason: 'Message cannot be empty',
      });
    });

    it('should reject messages that are too long', () => {
      const longMessage = 'a'.repeat(5000);
      const result = AIService.validateMessage(longMessage);

      expect(result).toEqual({
        isValid: false,
        reason: 'Message is too long (max 4000 characters)',
      });
    });

    it('should detect inappropriate content', () => {
      const inappropriateMessage = 'How to hack into systems';
      const result = AIService.validateMessage(inappropriateMessage);

      expect(result).toEqual({
        isValid: false,
        reason: 'Message contains inappropriate content',
      });
    });

    it('should detect spam patterns', () => {
      const spamMessage = 'BUY NOW!!! CLICK HERE!!! AMAZING DEAL!!!';
      const result = AIService.validateMessage(spamMessage);

      expect(result).toEqual({
        isValid: false,
        reason: 'Message appears to be spam',
      });
    });

    it('should allow career-related questions', () => {
      const careerMessages = [
        'What skills do I need for software engineering?',
        'How do I transition from marketing to data science?',
        'What are the best practices for job interviews?',
        'Should I pursue an MBA or gain more work experience?',
      ];

      careerMessages.forEach(message => {
        const result = AIService.validateMessage(message);
        expect(result.isValid).toBe(true);
      });
    });

    it('should handle special characters properly', () => {
      const messageWithSpecialChars =
        'What about C++ vs C# for career growth? 🤔';
      const result = AIService.validateMessage(messageWithSpecialChars);

      expect(result.isValid).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockOpenAI.chat.completions.create.mockRejectedValue(timeoutError);

      const conversationHistory = [
        { role: 'user' as const, content: 'Test message' },
      ];

      await expect(
        AIService.generateResponse(conversationHistory)
      ).rejects.toThrow('Request timeout');
    });

    it('should handle rate limiting', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      mockOpenAI.chat.completions.create.mockRejectedValue(rateLimitError);

      const conversationHistory = [
        { role: 'user' as const, content: 'Test message' },
      ];

      await expect(
        AIService.generateResponse(conversationHistory)
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle invalid API key', async () => {
      const authError = new Error('Invalid API key');
      authError.name = 'AuthenticationError';
      mockOpenAI.chat.completions.create.mockRejectedValue(authError);

      const conversationHistory = [
        { role: 'user' as const, content: 'Test message' },
      ];

      await expect(
        AIService.generateResponse(conversationHistory)
      ).rejects.toThrow('Invalid API key');
    });
  });

  describe('conversation context', () => {
    it('should maintain conversation context', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content:
                'Based on your previous question about software engineering, I recommend focusing on these skills...',
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const conversationHistory = [
        {
          role: 'user' as const,
          content: 'I want to become a software engineer',
        },
        {
          role: 'assistant' as const,
          content:
            'Great choice! Software engineering offers many opportunities.',
        },
        { role: 'user' as const, content: 'What skills should I focus on?' },
      ];

      const result = await AIService.generateResponse(conversationHistory);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            ...conversationHistory,
          ]),
        })
      );

      expect(result).toContain('software engineering');
    });

    it('should limit conversation history length', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Response based on recent context',
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      // Create a long conversation history
      const longHistory = Array.from({ length: 50 }, (_, i) => ({
        role: (i % 2 === 0 ? 'user' : 'assistant') as const,
        content: `Message ${i}`,
      }));

      await AIService.generateResponse(longHistory);

      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0];

      // Should limit the conversation history (system message + limited history)
      expect(callArgs.messages.length).toBeLessThan(52); // 50 + system message + buffer
    });
  });
});
