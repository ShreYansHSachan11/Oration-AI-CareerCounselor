import { GoogleGenerativeAI } from '@google/generative-ai';
import { TRPCError } from '@trpc/server';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIServiceOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class GeminiAIService {
  private static readonly DEFAULT_MODEL = 'gemini-1.5-flash';
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

  private static getGeminiClient() {
    if (!process.env.GEMINI_API_KEY) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Gemini API key not configured',
      });
    }

    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  /**
   * Generate AI response for career counseling using Gemini
   */
  static async generateResponse(
    messages: AIMessage[],
    options: AIServiceOptions = {}
  ): Promise<string> {
    try {
      console.log('🤖 Gemini AI: Starting response generation');
      console.log('📝 Messages received:', messages.length);
      
      const genAI = this.getGeminiClient();
      const {
        model = this.DEFAULT_MODEL,
        temperature = this.DEFAULT_TEMPERATURE,
      } = options;

      console.log('🔧 Using model:', model);

      const geminiModel = genAI.getGenerativeModel({ 
        model,
        generationConfig: {
          temperature,
          maxOutputTokens: options.maxTokens || this.DEFAULT_MAX_TOKENS,
        },
      });

      // Get the last user message
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      if (!lastUserMessage) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No user message found',
        });
      }

      console.log('💬 User message:', lastUserMessage.content.substring(0, 100) + '...');

      // Create a simple prompt with system context and user message
     const prompt = `${this.SYSTEM_PROMPT}

User: ${lastUserMessage.content}`;

console.log('📤 Sending prompt to Gemini...');
const result = await geminiModel.generateContent(prompt);
const response = result.response.text();
     

      if (!response) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'No response generated from AI service',
        });
      }

      console.log('✅ Gemini response received');
      return response.trim();
    } catch (error) {
      console.error('Gemini AI Service Error:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
      });

      // Handle specific Gemini API errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('api_key_invalid') || errorMessage.includes('invalid api key')) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Invalid Gemini API key. Please check your GEMINI_API_KEY environment variable.',
          });
        } else if (errorMessage.includes('rate_limit_exceeded') || errorMessage.includes('quota exceeded')) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'AI service rate limit exceeded. Please try again later.',
          });
        } else if (errorMessage.includes('safety') || errorMessage.includes('blocked')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Message was blocked by safety filters. Please rephrase your question.',
          });
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Network error connecting to AI service. Please try again.',
          });
        }
      }

      // Re-throw tRPC errors
      if (error instanceof TRPCError) {
        throw error;
      }

      // Generic error fallback with more details
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  /**
   * Generate a session title based on the first user message
   */
  static async generateSessionTitle(firstMessage: string): Promise<string> {
    try {
      const genAI = this.getGeminiClient();
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 20,
        },
      });

      const prompt = `Generate a short, descriptive title (max 50 characters) for a career counseling conversation based on this user message: "${firstMessage}". Focus on the main career topic or concern. Only return the title, nothing else.`;

      const result = await model.generateContent(prompt);
      const title = result.response.text().trim();

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