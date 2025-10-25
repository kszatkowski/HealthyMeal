import { describe, it, expect, vi } from "vitest";

/**
 * Example unit test demonstrating Vitest best practices
 * @see .cursor/rules/vitest-unit-testing.mdc
 */

/**
 * Simple function to test
 */
function add(a: number, b: number): number {
  return a + b;
}

describe("Unit Tests - Basic Examples", () => {
  describe("add function", () => {
    it("should add two positive numbers correctly", () => {
      // Arrange
      const a = 2;
      const b = 3;

      // Act
      const result = add(a, b);

      // Assert
      expect(result).toBe(5);
    });

    it("should handle negative numbers", () => {
      expect(add(-1, -1)).toBe(-2);
    });

    it("should return zero when adding zero", () => {
      expect(add(5, 0)).toBe(5);
    });
  });

  describe("Mocking examples", () => {
    it("should use vi.fn() for function mocks", () => {
      // Create a mock function
      const mockCallback = vi.fn();

      // Call the mock
      mockCallback("test argument");

      // Verify the mock was called correctly
      expect(mockCallback).toHaveBeenCalledWith("test argument");
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it("should use vi.spyOn() to spy on existing functions", () => {
      // Spy on the add function directly
      const addModule = { add };
      const spy = vi.spyOn(addModule, "add");

      // Call through the spied module
      const result = addModule.add(2, 3);

      // Verify the spy captured the call
      expect(spy).toHaveBeenCalledWith(2, 3);
      expect(result).toBe(5);

      // Clean up
      spy.mockRestore();
    });

    it("should use mockImplementation for dynamic control", () => {
      const mockFetch = vi.fn().mockImplementation((url: string) => {
        return { url, data: "custom data" };
      });

      const result = mockFetch("http://example.com");

      expect(result.data).toBe("custom data");
    });
  });

  describe("Inline snapshots", () => {
    it("should demonstrate inline snapshots for readable assertions", () => {
      const response = {
        status: 200,
        message: "Success",
        data: { id: 1, name: "Test" },
      };

      expect(response).toMatchInlineSnapshot(`
        {
          "data": {
            "id": 1,
            "name": "Test",
          },
          "message": "Success",
          "status": 200,
        }
      `);
    });
  });

  describe("Error handling with guard clauses", () => {
    it("should validate input parameters early", () => {
      function divideNumbers(a: number, b: number): number {
        // Guard clause for invalid input
        if (b === 0) {
          throw new Error("Division by zero is not allowed");
        }

        return a / b;
      }

      expect(() => divideNumbers(10, 0)).toThrow("Division by zero is not allowed");
    });
  });

  describe("Type checking in tests", () => {
    it("should verify type correctness at compile time", () => {
      // TypeScript will check this at compile time
      const value = 42;
      expect(value).toBe(42);
    });
  });
});
