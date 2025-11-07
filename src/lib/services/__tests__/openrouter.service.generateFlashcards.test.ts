/**
 * Unit tests for OpenRouterService.generateFlashcards method
 *
 * Test coverage:
 * - Successful flashcard generation
 * - HTTP error responses
 * - Timeout handling
 * - Invalid response structures
 * - JSON parsing errors
 * - Missing required fields
 * - Character limit enforcement
 * - Count mismatch handling
 * - Network errors
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { OpenRouterService, type OpenRouterConfig, type GenerateFlashcardsRequest } from "../openrouter.service";

describe("OpenRouterService.generateFlashcards", () => {
  let service: OpenRouterService;
  let config: OpenRouterConfig;
  let mockFetch: ReturnType<typeof vi.fn>;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    // Arrange: Setup config
    config = {
      apiKey: "test-api-key",
      model: "test-model",
      siteUrl: "https://test-site.com",
      appName: "Test App",
    };

    // Arrange: Store original fetch
    originalFetch = global.fetch;

    // Arrange: Create mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch as unknown as typeof fetch;

    // Arrange: Create service instance
    service = new OpenRouterService(config);

    // Arrange: Mock timers for timeout tests
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Cleanup: Restore original fetch
    global.fetch = originalFetch;

    // Cleanup: Restore real timers
    vi.useRealTimers();
  });

  describe("Successful flashcard generation", () => {
    it("should generate flashcards with valid response", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text about biology",
        count: 12,
      };

      const expectedFlashcards = [
        { front: "What is DNA?", back: "Deoxyribonucleic acid" },
        { front: "What is RNA?", back: "Ribonucleic acid" },
      ];

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: expectedFlashcards,
                }),
              },
            },
          ],
        }),
        text: vi.fn(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.generateFlashcards(request);

      // Assert
      expect(result).toEqual(expectedFlashcards);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "HTTP-Referer": config.siteUrl,
            "X-Title": config.appName,
            "Content-Type": "application/json",
          },
          body: expect.stringContaining(request.sourceText),
        })
      );
    });

    it("should trim whitespace from front and back fields", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const mockFlashcards = [{ front: "  What is DNA?  ", back: "  Answer with spaces  " }];

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: mockFlashcards,
                }),
              },
            },
          ],
        }),
        text: vi.fn(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.generateFlashcards(request);

      // Assert
      expect(result[0].front).toBe("What is DNA?");
      expect(result[0].back).toBe("Answer with spaces");
    });

    it("should truncate front and back to 5000 characters", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const longText = "a".repeat(6000);
      const mockFlashcards = [{ front: longText, back: longText }];

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: mockFlashcards,
                }),
              },
            },
          ],
        }),
        text: vi.fn(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.generateFlashcards(request);

      // Assert
      expect(result[0].front).toHaveLength(5000);
      expect(result[0].back).toHaveLength(5000);
    });

    it("should handle count mismatch without failing", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      // AI returns fewer flashcards than requested
      const mockFlashcards = [
        { front: "Question 1", back: "Answer 1" },
        { front: "Question 2", back: "Answer 2" },
      ];

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: mockFlashcards,
                }),
              },
            },
          ],
        }),
        text: vi.fn(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.generateFlashcards(request);

      // Assert - should return all flashcards even if count doesn't match
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockFlashcards);
    });

    it("should send correct system prompt in request", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: [{ front: "Q", back: "A" }],
                }),
              },
            },
          ],
        }),
        text: vi.fn(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act
      await service.generateFlashcards(request);

      // Assert
      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.messages).toHaveLength(2);
      expect(body.messages[0].role).toBe("system");
      expect(body.messages[0].content).toContain("flashcard generation assistant");
      expect(body.messages[0].content).toContain("Generate exactly 12 flashcards");
      expect(body.messages[1].role).toBe("user");
      expect(body.messages[1].content).toBe(request.sourceText);
    });
  });

  describe("HTTP error handling", () => {
    it("should throw error on non-OK response status", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const mockResponse = {
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue("Unauthorized"),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.generateFlashcards(request)).rejects.toThrow("OpenRouter API returned 401: Unauthorized");
    });

    it("should handle error when response.text() fails", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const mockResponse = {
        ok: false,
        status: 500,
        text: vi.fn().mockRejectedValue(new Error("Text parsing failed")),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.generateFlashcards(request)).rejects.toThrow("OpenRouter API returned 500: Unknown error");
    });

    it("should handle 429 rate limit error", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const mockResponse = {
        ok: false,
        status: 429,
        text: vi.fn().mockResolvedValue("Rate limit exceeded"),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.generateFlashcards(request)).rejects.toThrow(
        "OpenRouter API returned 429: Rate limit exceeded"
      );
    });
  });

  describe("Timeout handling", () => {
    it("should timeout after 30 seconds", async () => {
      // Use real timers for this test to avoid unhandled rejection warnings
      vi.useRealTimers();

      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 1,
      };

      // Mock fetch that simulates a hanging request
      mockFetch.mockImplementation((url, options) => {
        return new Promise((resolve, reject) => {
          if (options?.signal) {
            options.signal.addEventListener("abort", () => {
              const error = new Error("Request timeout");
              error.name = "AbortError";
              reject(error);
            });
          }
          // Never resolve - simulates hanging request
        });
      });

      // Act & Assert - should timeout after 30 seconds
      await expect(service.generateFlashcards(request)).rejects.toThrow(
        "Request timeout - AI service took too long to respond"
      );

      // Restore fake timers for other tests
      vi.useFakeTimers();
    }, 31000); // Set test timeout slightly higher than service timeout

    it("should clear timeout on successful response", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: [{ front: "Q", back: "A" }],
                }),
              },
            },
          ],
        }),
        text: vi.fn(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Spy on clearTimeout
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

      // Act
      await service.generateFlashcards(request);

      // Assert
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("should clear timeout on error response", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const mockResponse = {
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue("Internal server error"),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Spy on clearTimeout
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

      // Act & Assert
      await expect(service.generateFlashcards(request)).rejects.toThrow();
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe("Invalid response structure", () => {
    it("should throw error when choices array is missing", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({}),
        text: vi.fn(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.generateFlashcards(request)).rejects.toThrow("Invalid OpenRouter response structure");
    });

    it("should throw error when choices array is empty", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [],
        }),
        text: vi.fn(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.generateFlashcards(request)).rejects.toThrow("Invalid OpenRouter response structure");
    });

    it("should throw error when message is missing", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [{}],
        }),
        text: vi.fn(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.generateFlashcards(request)).rejects.toThrow("Invalid OpenRouter response structure");
    });
  });

  describe("JSON parsing errors", () => {
    it("should throw error when content is not valid JSON", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: "This is not valid JSON",
              },
            },
          ],
        }),
        text: vi.fn(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.generateFlashcards(request)).rejects.toThrow("Failed to parse OpenRouter response as JSON");
    });

    it("should throw error when flashcards property is missing", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  data: "wrong structure",
                }),
              },
            },
          ],
        }),
        text: vi.fn(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.generateFlashcards(request)).rejects.toThrow("Invalid flashcards structure in response");
    });

    it("should throw error when flashcards is not an array", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: "not an array",
                }),
              },
            },
          ],
        }),
        text: vi.fn(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.generateFlashcards(request)).rejects.toThrow("Invalid flashcards structure in response");
    });
  });

  describe("Missing required fields", () => {
    it("should throw error when flashcard is missing front field", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: [{ back: "Answer only" }],
                }),
              },
            },
          ],
        }),
        text: vi.fn(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.generateFlashcards(request)).rejects.toThrow("Flashcard missing front or back");
    });

    it("should throw error when flashcard is missing back field", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: [{ front: "Question only" }],
                }),
              },
            },
          ],
        }),
        text: vi.fn(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.generateFlashcards(request)).rejects.toThrow("Flashcard missing front or back");
    });

    it("should throw error when one flashcard in array is invalid", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: [
                    { front: "Valid", back: "Valid" },
                    { front: "Invalid" }, // Missing back
                  ],
                }),
              },
            },
          ],
        }),
        text: vi.fn(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.generateFlashcards(request)).rejects.toThrow("Flashcard missing front or back");
    });
  });

  describe("Network errors", () => {
    it("should throw error on network failure", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const networkError = new Error("Network error");
      mockFetch.mockRejectedValue(networkError);

      // Act & Assert
      await expect(service.generateFlashcards(request)).rejects.toThrow("Network error");
    });

    it("should throw error when JSON parsing of response fails", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON in response")),
        text: vi.fn(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.generateFlashcards(request)).rejects.toThrow("Invalid JSON in response");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty flashcards array", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: [],
                }),
              },
            },
          ],
        }),
        text: vi.fn(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.generateFlashcards(request);

      // Assert
      expect(result).toEqual([]);
    });

    it("should convert non-string front and back to strings", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: [
                    { front: 123, back: true }, // Non-string values
                  ],
                }),
              },
            },
          ],
        }),
        text: vi.fn(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.generateFlashcards(request);

      // Assert
      expect(result[0].front).toBe("123");
      expect(result[0].back).toBe("true");
    });

    it("should handle special characters in flashcards", async () => {
      // Arrange
      const request: GenerateFlashcardsRequest = {
        sourceText: "Test text",
        count: 12,
      };

      const specialChars = "Special chars: 你好 émojis 🎉 quotes \"' and \n newlines";
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: [{ front: specialChars, back: specialChars }],
                }),
              },
            },
          ],
        }),
        text: vi.fn(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.generateFlashcards(request);

      // Assert
      expect(result[0].front).toBe(specialChars);
      expect(result[0].back).toBe(specialChars);
    });
  });
});
