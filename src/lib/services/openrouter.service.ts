/**
 * OpenRouter AI Service
 * Handles communication with OpenRouter API for flashcard generation
 */

/**
 * Configuration for OpenRouter service
 */
export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  siteUrl: string;
  appName: string;
}

/**
 * Request parameters for flashcard generation
 */
export interface GenerateFlashcardsRequest {
  sourceText: string;
  count: number;
}

/**
 * Single flashcard proposal from AI
 */
export interface FlashcardProposal {
  front: string;
  back: string;
}

/**
 * Service for interacting with OpenRouter API
 */
export class OpenRouterService {
  constructor(private config: OpenRouterConfig) {}

  /**
   * Creates the system prompt for flashcard generation
   * @returns Formatted system prompt with generation rules
   */
  private createSystemPrompt(): string {
    return `You are a flashcard generation assistant. Your task is to create high-quality flashcards from the provided text.

Rules:
1. Generate exactly 12 flashcards
2. Each flashcard should have:
   - Front: A concept, term, or question (max 200 characters)
   - Back: A definition, explanation, or answer (max 500 characters)
3. Focus on the most important concepts
4. Make flashcards clear and concise
5. Ensure each flashcard tests a single concept
6. Always generate flashcards in language of the source text
7. Return ONLY valid JSON in this format:
{
  "flashcards": [
    {"front": "concept", "back": "definition"},
    ...
  ]
}`;
  }

  /**
   * Generates flashcards from source text using OpenRouter API
   * @param request - Generation request with source text and desired count
   * @returns Array of flashcard proposals
   * @throws Error if API call fails or response is invalid
   */
  async generateFlashcards(request: GenerateFlashcardsRequest): Promise<FlashcardProposal[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "HTTP-Referer": this.config.siteUrl,
          "X-Title": this.config.appName,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: "system",
              content: this.createSystemPrompt(),
            },
            {
              role: "user",
              content: request.sourceText,
            },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`OpenRouter API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return this.parseResponse(data, request.count);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timeout - AI service took too long to respond");
      }

      throw error;
    }
  }

  /**
   * Parses and validates OpenRouter API response
   * @param data - Raw API response data
   * @param expectedCount - Expected number of flashcards
   * @returns Validated array of flashcard proposals
   * @throws Error if response structure is invalid
   */
  private parseResponse(data: unknown, expectedCount: number): FlashcardProposal[] {
    // 1. Check response structure
    const typedData = data as Record<string, unknown>;
    const choices = typedData.choices as Record<string, unknown>[] | undefined;

    if (!choices || !choices[0] || !choices[0].message) {
      throw new Error("Invalid OpenRouter response structure");
    }

    // 2. Extract content
    const message = choices[0].message as Record<string, unknown>;
    const content = message.content as string;

    // 3. Parse JSON
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content) as Record<string, unknown>;
    } catch {
      throw new Error("Failed to parse OpenRouter response as JSON");
    }

    // 4. Validate structure
    if (!parsed.flashcards || !Array.isArray(parsed.flashcards)) {
      throw new Error("Invalid flashcards structure in response");
    }

    // 5. Map and validate each flashcard
    const proposals: FlashcardProposal[] = parsed.flashcards.map((card: Record<string, unknown>) => {
      if (!card.front || !card.back) {
        throw new Error("Flashcard missing front or back");
      }

      return {
        front: String(card.front).trim().substring(0, 5000),
        back: String(card.back).trim().substring(0, 5000),
      };
    });

    // 6. Check count (log but don't fail)
    if (proposals.length !== expectedCount) {
      // Expected behavior - log for monitoring but continue
    }

    return proposals;
  }
}
