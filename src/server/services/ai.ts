import { TRPCError } from '@trpc/server';
import { GeminiAIService } from './gemini-ai.service';

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
  /**
   * Generate AI response for career counseling using Gemini
   */
  static async generateResponse(
    messages: AIMessage[],
    options: AIServiceOptions = {}
  ): Promise<string> {
    // Use Gemini AI service
    if (!process.env.GEMINI_API_KEY) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Gemini API key not configured. Please set GEMINI_API_KEY in your environment variables.',
      });
    }

    try {
      return await GeminiAIService.generateResponse(messages, options);
    } catch (error) {
      console.error('Gemini AI Service Error:', error);
      
      // Re-throw tRPC errors
      if (error instanceof TRPCError) {
        throw error;
      }

      // Generic error fallback
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate AI response. Please try again.',
      });
    }
  }

  /**
   * Generate a session title based on the first user message
   */
  static async generateSessionTitle(firstMessage: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
      return this.createFallbackTitle(firstMessage);
    }

    try {
      return await GeminiAIService.generateSessionTitle(firstMessage);
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
    return GeminiAIService.validateMessage(content);
  }
}
