import OpenAI from 'openai';
import { TRPCError } from '@trpc/server';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIServiceOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class AIService {
  private static readonly DEFAULT_MODEL = 'gpt-4';
  private static readonly DEFAULT_MAX_TOKENS = 1000;
  private static readonly DEFAULT_TEMPERATURE = 0.7;

  private static readonly SYSTEM_PROMPT = `You are a professional career counselor with extensive experience in helping people navigate their career paths. Your role is to provide thoughtful, personalized career guidance and advice.

Key guidelines for your responses:
- Be empathetic and supportive while maintaining professionalism
- Ask clarifying questions when you need more information
- Provide actionable advice and concrete next steps
- Draw from best practices in career development and counseling
- Be encouraging while being realistic about challenges
- Respect the user's autonomy in making their own decisions
- Keep responses focused and relevant to career-related topics
- If asked about non-career topics, politely redirect to career counseling

Remember that you're helping someone make important life decisions, so be thorough and considerate in your responses.`;

  /**
   * Generate AI response for career counseling
   */
  static async generateResponse(
    messages: AIMessage[],
    options: AIServiceOptions = {}
  ): Promise<string> {
    try {
      // Validate API key
      if (!process.env.OPENAI_API_KEY) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'OpenAI API key not configured',
        });
      }

      const {
        model = this.DEFAULT_MODEL,
        maxTokens = this.DEFAULT_MAX_TOKENS,
        temperature = this.DEFAULT_TEMPERATURE,
      } = options;

      // Prepare messages with system prompt
      const conversationMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        [
          {
            role: 'system',
            content: this.SYSTEM_PROMPT,
          },
          ...messages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })),
        ];

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model,
        messages: conversationMessages,
        max_tokens: maxTokens,
        temperature,
        stream: false,
      });

      const response = completion.choices[0]?.message?.content;

      if (!response) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'No response generated from AI service',
        });
      }

      return response.trim();
    } catch (error) {
      // Handle OpenAI API errors
      if (error instanceof OpenAI.APIError) {
        if (error.status === 401) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Invalid OpenAI API key',
          });
        } else if (error.status === 429) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'AI service rate limit exceeded. Please try again later.',
          });
        } else if (error.status === 500) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'AI service is temporarily unavailable',
          });
        }
      }

      // Handle network errors
      if (error instanceof Error && error.message.includes('network')) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Network error connecting to AI service',
        });
      }

      // Re-throw tRPC errors
      if (error instanceof TRPCError) {
        throw error;
      }

      // Generic error fallback
      console.error('AI Service Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate AI response',
      });
    }
  }

  /**
   * Generate a session title based on the first user message
   */
  static async generateSessionTitle(firstMessage: string): Promise<string> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        // Fallback to a simple title if no API key
        return this.createFallbackTitle(firstMessage);
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Use cheaper model for title generation
        messages: [
          {
            role: 'system',
            content:
              "Generate a short, descriptive title (max 50 characters) for a career counseling conversation based on the user's first message. Focus on the main career topic or concern.",
          },
          {
            role: 'user',
            content: firstMessage,
          },
        ],
        max_tokens: 20,
        temperature: 0.3,
      });

      const title = completion.choices[0]?.message?.content?.trim();

      if (!title) {
        return this.createFallbackTitle(firstMessage);
      }

      // Ensure title is not too long
      return title.length > 50 ? title.substring(0, 47) + '...' : title;
    } catch (error) {
      console.error('Error generating session title:', error);
      return this.createFallbackTitle(firstMessage);
    }
  }

  /**
   * Create a fallback title when AI generation fails
   */
  private static createFallbackTitle(message: string): string {
    // Extract first few words as title
    const words = message.trim().split(' ').slice(0, 6);
    let title = words.join(' ');

    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }

    return title || 'Career Discussion';
  }

  /**
   * Validate message content for safety and appropriateness
   */
  static validateMessage(content: string): {
    isValid: boolean;
    reason?: string;
  } {
    // Basic content validation
    if (!content || content.trim().length === 0) {
      return { isValid: false, reason: 'Message cannot be empty' };
    }

    if (content.length > 4000) {
      return {
        isValid: false,
        reason: 'Message is too long (max 4000 characters)',
      };
    }

    // Check for potentially harmful content patterns
    const harmfulPatterns = [
      /\b(suicide|kill myself|end it all)\b/i,
      /\b(illegal|drugs|violence)\b/i,
    ];

    for (const pattern of harmfulPatterns) {
      if (pattern.test(content)) {
        return {
          isValid: false,
          reason:
            'Message contains content that requires professional support beyond career counseling',
        };
      }
    }

    return { isValid: true };
  }
}
