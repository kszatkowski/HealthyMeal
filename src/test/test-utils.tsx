import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";

/**
 * Custom render function for tests
 * Provides common providers and setup for React components
 */
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) => {
  const Wrapper = ({ children }: { children: ReactElement }) => {
    return <>{children}</>;
  };

  return render(ui, { wrapper: Wrapper as React.ComponentType<{ children: React.ReactNode }>, ...options });
};

// Re-export everything from React Testing Library
export * from "@testing-library/react";

// Override the default render function
export { customRender as render };
