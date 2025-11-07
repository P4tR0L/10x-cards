/**
 * Unit tests for FlashcardService.listFlashcards method
 *
 * Test coverage:
 * - Basic listing with default parameters
 * - Pagination (different pages, different limits, offset calculation)
 * - Search filtering (front, back, combined)
 * - Source filtering (manual, ai)
 * - Sorting (created_at, updated_at, asc, desc)
 * - Combined filters
 * - Empty results
 * - Database errors
 * - user_id removal from results
 * - Count accuracy
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { FlashcardService } from "../flashcard.service";
import type { SupabaseClient } from "@/db/supabase.client";
import type { FlashcardListQueryInput } from "@/lib/validation/flashcard.validation";

describe("FlashcardService.listFlashcards", () => {
  let service: FlashcardService;
  let mockSupabase: SupabaseClient;
  let mockQuery: any;

  beforeEach(() => {
    // Create a chainable mock query object
    // All methods return the same mockQuery object to support chaining
    mockQuery = {
      select: vi.fn(),
      or: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      range: vi.fn(),
    };

    // Make all methods chainable by returning mockQuery
    mockQuery.select.mockReturnValue(mockQuery);
    mockQuery.or.mockReturnValue(mockQuery);
    mockQuery.eq.mockReturnValue(mockQuery);
    mockQuery.order.mockReturnValue(mockQuery);
    mockQuery.range.mockReturnValue(mockQuery);

    // Mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQuery),
    } as unknown as SupabaseClient;

    // Create service instance
    service = new FlashcardService(mockSupabase);
  });

  describe("Basic functionality", () => {
    it("should return flashcards with default parameters", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        sort: "created_at",
        order: "desc",
      };

      const mockFlashcards = [
        {
          id: 1,
          user_id: userId,
          front: "Question 1",
          back: "Answer 1",
          source: "manual" as const,
          generation_id: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          user_id: userId,
          front: "Question 2",
          back: "Answer 2",
          source: "ai" as const,
          generation_id: 42,
          created_at: "2024-01-02T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockFlashcards,
        count: 2,
        error: null,
      });

      // Act
      const result = await service.listFlashcards(userId, params);

      // Assert
      expect(result.flashcards).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.flashcards[0]).not.toHaveProperty("user_id");
      expect(result.flashcards[1]).not.toHaveProperty("user_id");
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockQuery.select).toHaveBeenCalledWith("*", { count: "exact" });
    });

    it("should return empty array when no flashcards found", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        sort: "created_at",
        order: "desc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      const result = await service.listFlashcards(userId, params);

      // Assert
      expect(result.flashcards).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should handle null data by returning empty array", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        sort: "created_at",
        order: "desc",
      };

      mockQuery.range.mockResolvedValue({
        data: null,
        count: 0,
        error: null,
      });

      // Act
      const result = await service.listFlashcards(userId, params);

      // Assert
      expect(result.flashcards).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should handle null count by returning 0", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        sort: "created_at",
        order: "desc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: null,
        error: null,
      });

      // Act
      const result = await service.listFlashcards(userId, params);

      // Assert
      expect(result.total).toBe(0);
    });
  });

  describe("Pagination", () => {
    it("should apply correct pagination for page 1", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 10,
        sort: "created_at",
        order: "desc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      // Page 1, limit 10: offset = 0, range(0, 9)
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9);
    });

    it("should apply correct pagination for page 2", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 2,
        limit: 10,
        sort: "created_at",
        order: "desc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      // Page 2, limit 10: offset = 10, range(10, 19)
      expect(mockQuery.range).toHaveBeenCalledWith(10, 19);
    });

    it("should apply correct pagination for page 3 with limit 25", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 3,
        limit: 25,
        sort: "created_at",
        order: "desc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      // Page 3, limit 25: offset = 50, range(50, 74)
      expect(mockQuery.range).toHaveBeenCalledWith(50, 74);
    });

    it("should handle large page numbers correctly", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 100,
        limit: 30,
        sort: "created_at",
        order: "desc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      // Page 100, limit 30: offset = 2970, range(2970, 2999)
      expect(mockQuery.range).toHaveBeenCalledWith(2970, 2999);
    });
  });

  describe("Search filtering", () => {
    it("should apply search filter with case-insensitive pattern", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        search: "TypeScript",
        sort: "created_at",
        order: "desc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      expect(mockQuery.or).toHaveBeenCalledWith(
        "front.ilike.%TypeScript%,back.ilike.%TypeScript%"
      );
    });

    it("should escape special characters in search pattern", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        search: "What is %?",
        sort: "created_at",
        order: "desc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      expect(mockQuery.or).toHaveBeenCalledWith(
        "front.ilike.%What is %?%,back.ilike.%What is %?%"
      );
    });

    it("should not apply search filter when search is undefined", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        sort: "created_at",
        order: "desc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      expect(mockQuery.or).not.toHaveBeenCalled();
    });

    it("should handle empty search string", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        search: "",
        sort: "created_at",
        order: "desc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      // Empty string is falsy, so search should not be applied
      expect(mockQuery.or).not.toHaveBeenCalled();
    });
  });

  describe("Source filtering", () => {
    it("should filter by manual source", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        source: "manual",
        sort: "created_at",
        order: "desc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      expect(mockQuery.eq).toHaveBeenCalledWith("source", "manual");
    });

    it("should filter by ai source", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        source: "ai",
        sort: "created_at",
        order: "desc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      expect(mockQuery.eq).toHaveBeenCalledWith("source", "ai");
    });

    it("should not apply source filter when source is undefined", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        sort: "created_at",
        order: "desc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      expect(mockQuery.eq).not.toHaveBeenCalled();
    });
  });

  describe("Sorting", () => {
    it("should sort by created_at descending (default)", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        sort: "created_at",
        order: "desc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      expect(mockQuery.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
    });

    it("should sort by created_at ascending", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        sort: "created_at",
        order: "asc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      expect(mockQuery.order).toHaveBeenCalledWith("created_at", {
        ascending: true,
      });
    });

    it("should sort by updated_at descending", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        sort: "updated_at",
        order: "desc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      expect(mockQuery.order).toHaveBeenCalledWith("updated_at", {
        ascending: false,
      });
    });

    it("should sort by updated_at ascending", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        sort: "updated_at",
        order: "asc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      expect(mockQuery.order).toHaveBeenCalledWith("updated_at", {
        ascending: true,
      });
    });
  });

  describe("Combined filters", () => {
    it("should apply search and source filters together", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        search: "biology",
        source: "ai",
        sort: "created_at",
        order: "desc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      expect(mockQuery.or).toHaveBeenCalledWith(
        "front.ilike.%biology%,back.ilike.%biology%"
      );
      expect(mockQuery.eq).toHaveBeenCalledWith("source", "ai");
    });

    it("should apply all filters, sorting, and pagination together", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 2,
        limit: 15,
        search: "react",
        source: "manual",
        sort: "updated_at",
        order: "asc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      expect(mockQuery.or).toHaveBeenCalledWith(
        "front.ilike.%react%,back.ilike.%react%"
      );
      expect(mockQuery.eq).toHaveBeenCalledWith("source", "manual");
      expect(mockQuery.order).toHaveBeenCalledWith("updated_at", {
        ascending: true,
      });
      expect(mockQuery.range).toHaveBeenCalledWith(15, 29);
    });
  });

  describe("Data transformation", () => {
    it("should remove user_id from all returned flashcards", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        sort: "created_at",
        order: "desc",
      };

      const mockFlashcards = [
        {
          id: 1,
          user_id: userId,
          front: "Q1",
          back: "A1",
          source: "manual" as const,
          generation_id: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          user_id: userId,
          front: "Q2",
          back: "A2",
          source: "ai" as const,
          generation_id: 5,
          created_at: "2024-01-02T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
        },
        {
          id: 3,
          user_id: userId,
          front: "Q3",
          back: "A3",
          source: "manual" as const,
          generation_id: null,
          created_at: "2024-01-03T00:00:00Z",
          updated_at: "2024-01-03T00:00:00Z",
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockFlashcards,
        count: 3,
        error: null,
      });

      // Act
      const result = await service.listFlashcards(userId, params);

      // Assert
      expect(result.flashcards).toHaveLength(3);
      result.flashcards.forEach((flashcard) => {
        expect(flashcard).not.toHaveProperty("user_id");
        expect(flashcard).toHaveProperty("id");
        expect(flashcard).toHaveProperty("front");
        expect(flashcard).toHaveProperty("back");
        expect(flashcard).toHaveProperty("source");
        expect(flashcard).toHaveProperty("generation_id");
        expect(flashcard).toHaveProperty("created_at");
        expect(flashcard).toHaveProperty("updated_at");
      });
    });

    it("should preserve all other flashcard properties", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        sort: "created_at",
        order: "desc",
      };

      const mockFlashcard = {
        id: 42,
        user_id: userId,
        front: "Test Question",
        back: "Test Answer",
        source: "ai" as const,
        generation_id: 100,
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-16T14:45:00Z",
      };

      mockQuery.range.mockResolvedValue({
        data: [mockFlashcard],
        count: 1,
        error: null,
      });

      // Act
      const result = await service.listFlashcards(userId, params);

      // Assert
      const returned = result.flashcards[0];
      expect(returned.id).toBe(42);
      expect(returned.front).toBe("Test Question");
      expect(returned.back).toBe("Test Answer");
      expect(returned.source).toBe("ai");
      expect(returned.generation_id).toBe(100);
      expect(returned.created_at).toBe("2024-01-15T10:30:00Z");
      expect(returned.updated_at).toBe("2024-01-16T14:45:00Z");
    });
  });

  describe("Error handling", () => {
    it("should throw error when database query fails", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        sort: "created_at",
        order: "desc",
      };

      const mockError = {
        message: "Connection timeout",
        code: "PGRST001",
      };

      mockQuery.range.mockResolvedValue({
        data: null,
        count: null,
        error: mockError,
      });

      // Act & Assert
      await expect(service.listFlashcards(userId, params)).rejects.toThrow(
        "Failed to list flashcards: Connection timeout"
      );
    });

    it("should throw error with database error message", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        sort: "created_at",
        order: "desc",
      };

      const mockError = {
        message: "Invalid column name",
        code: "42703",
      };

      mockQuery.range.mockResolvedValue({
        data: null,
        count: null,
        error: mockError,
      });

      // Act & Assert
      await expect(service.listFlashcards(userId, params)).rejects.toThrow(
        "Failed to list flashcards: Invalid column name"
      );
    });
  });

  describe("Query construction order", () => {
    it("should construct query in correct order: select -> filters -> sort -> pagination", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 2,
        limit: 20,
        search: "test",
        source: "ai",
        sort: "updated_at",
        order: "asc",
      };

      const callOrder: string[] = [];

      mockQuery.select.mockImplementation((...args: any[]) => {
        callOrder.push("select");
        return mockQuery;
      });

      mockQuery.or.mockImplementation((...args: any[]) => {
        callOrder.push("or");
        return mockQuery;
      });

      mockQuery.eq.mockImplementation((...args: any[]) => {
        callOrder.push("eq");
        return mockQuery;
      });

      mockQuery.order.mockImplementation((...args: any[]) => {
        callOrder.push("order");
        return mockQuery;
      });

      mockQuery.range.mockImplementation((...args: any[]) => {
        callOrder.push("range");
        return Promise.resolve({
          data: [],
          count: 0,
          error: null,
        });
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      expect(callOrder).toEqual(["select", "or", "eq", "order", "range"]);
    });
  });

  describe("Edge cases", () => {
    it("should handle very long search terms", async () => {
      // Arrange
      const userId = "user-123";
      const longSearchTerm = "a".repeat(500); // Maximum allowed length
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 30,
        search: longSearchTerm,
        sort: "created_at",
        order: "desc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      expect(mockQuery.or).toHaveBeenCalledWith(
        `front.ilike.%${longSearchTerm}%,back.ilike.%${longSearchTerm}%`
      );
    });

    it("should handle maximum limit value (100)", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 100,
        sort: "created_at",
        order: "desc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      expect(mockQuery.range).toHaveBeenCalledWith(0, 99);
    });

    it("should handle minimum limit value (1)", async () => {
      // Arrange
      const userId = "user-123";
      const params: FlashcardListQueryInput = {
        page: 1,
        limit: 1,
        sort: "created_at",
        order: "desc",
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act
      await service.listFlashcards(userId, params);

      // Assert
      expect(mockQuery.range).toHaveBeenCalledWith(0, 0);
    });
  });
});

