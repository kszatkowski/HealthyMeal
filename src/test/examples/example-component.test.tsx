import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "../test-utils";
import React from "react";

/**
 * Example React component for testing
 */
function Counter() {
  const [count, setCount] = React.useState(0);

  return (
    <div>
      <h1>Counter</h1>
      <p>Current count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

/**
 * Example component with form
 */
function LoginForm() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Guard clause for validation
    if (!username || !password) {
      setError("All fields are required");
      return;
    }

    // Happy path
    setError("");
    console.log("Form submitted:", { username, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
        />
      </div>
      {error && <p role="alert">{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}

describe("React Component Tests", () => {
  describe("Counter Component", () => {
    it("should render initial count of 0", () => {
      render(<Counter />);

      const countText = screen.getByText(/Current count: 0/);
      expect(countText).toBeInTheDocument();
    });

    it("should increment count when button is clicked", async () => {
      render(<Counter />);

      const incrementButton = screen.getByRole("button", { name: /Increment/i });
      fireEvent.click(incrementButton);

      expect(screen.getByText(/Current count: 1/)).toBeInTheDocument();
    });

    it("should decrement count when button is clicked", () => {
      render(<Counter />);

      const incrementButton = screen.getByRole("button", {
        name: /Increment/i,
      });
      const decrementButton = screen.getByRole("button", {
        name: /Decrement/i,
      });

      // Increment twice
      fireEvent.click(incrementButton);
      fireEvent.click(incrementButton);

      // Decrement once
      fireEvent.click(decrementButton);

      expect(screen.getByText(/Current count: 1/)).toBeInTheDocument();
    });

    it("should reset count to 0", () => {
      render(<Counter />);

      const incrementButton = screen.getByRole("button", {
        name: /Increment/i,
      });
      const resetButton = screen.getByRole("button", { name: /Reset/i });

      fireEvent.click(incrementButton);
      fireEvent.click(incrementButton);
      fireEvent.click(resetButton);

      expect(screen.getByText(/Current count: 0/)).toBeInTheDocument();
    });
  });

  describe("LoginForm Component", () => {
    it("should render form fields correctly", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Login/i })).toBeInTheDocument();
    });

    it("should show error when fields are empty", () => {
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: /Login/i });
      fireEvent.click(submitButton);

      expect(screen.getByRole("alert", { hidden: false })).toHaveTextContent("All fields are required");
    });

    it("should clear error when valid input is provided", async () => {
      render(<LoginForm />);

      // Fill in the form
      const usernameInput = screen.getByLabelText(/Username/i);
      const passwordInput = screen.getByLabelText(/Password/i);

      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      // Submit the form
      const submitButton = screen.getByRole("button", { name: /Login/i });
      fireEvent.click(submitButton);

      // Error should not be visible
      const errorElements = screen.queryAllByRole("alert");
      expect(errorElements.length).toBe(0);
    });

    it("should update input values as user types", () => {
      render(<LoginForm />);

      const usernameInput = screen.getByLabelText(/Username/i) as HTMLInputElement;

      fireEvent.change(usernameInput, { target: { value: "john_doe" } });

      expect(usernameInput.value).toBe("john_doe");
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for form inputs", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    });

    it("should use semantic button elements", () => {
      render(<Counter />);

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((button) => {
        expect(button.tagName).toBe("BUTTON");
      });
    });
  });
});
