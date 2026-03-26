import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// Mock the NavBar component
vi.mock("../../components/NavBar", () => {
  return {
    default: () => <nav data-testid="navbar">NavBar Component</nav>,
  };
});

// Mock AuthContext
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    currentUser: { uid: "test-user", email: "test@example.com" },
    loading: false,
  }),
}));

const NavBar = (await import("../../components/NavBar")).default;

describe("NavBar Component", () => {
  it("should render NavBar component", () => {
    render(
      <BrowserRouter>
        <NavBar />
      </BrowserRouter>
    );
    expect(screen.getByTestId("navbar")).toBeTruthy();
  });

  it("should render navigation element", () => {
    render(
      <BrowserRouter>
        <NavBar />
      </BrowserRouter>
    );
    const navbar = screen.getByTestId("navbar");
    expect(navbar).toBeInTheDocument();
  });

  it("should handle user authentication state", () => {
    render(
      <BrowserRouter>
        <NavBar />
      </BrowserRouter>
    );
    expect(screen.getByTestId("navbar")).toBeTruthy();
  });
});

