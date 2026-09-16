import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Login } from "../../src/components/Login";
import { AuthContext } from "../../src/context/AuthContext";
import React from "react";

// Mock the AuthContext value
const mockLogin = vi.fn();
const mockLogout = vi.fn();
const mockLoadUser = vi.fn();

const renderLogin = (authValue: any = {}) => {
  return render(
    <AuthContext.Provider
      value={{
        user: null,
        loading: false,
        error: null,
        login: mockLogin,
        logout: mockLogout,
        loadUser: mockLoadUser,
        ...authValue,
      }}
    >
      <Login />
    </AuthContext.Provider>
  );
};

describe("Login Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password inputs", () => {
    renderLogin();
    
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
  });

  it("validates empty fields", async () => {
    renderLogin();
    
    const user = userEvent.setup();
    const submitBtn = screen.getByRole("button", { name: /Sign In/i });
    
    await user.click(submitBtn);
    
    expect(screen.getByText(/Email and password are required/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("toggles password visibility", async () => {
    renderLogin();
    
    const user = userEvent.setup();
    const passwordInput = screen.getByLabelText(/Password/i);
    const toggleBtn = screen.getByRole("button", { name: /👁️/i }); // matches either icon
    
    expect(passwordInput).toHaveAttribute("type", "password");
    
    await user.click(toggleBtn);
    expect(passwordInput).toHaveAttribute("type", "text");
    
    await user.click(toggleBtn);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("shows generic error message on API failure", async () => {
    mockLogin.mockResolvedValueOnce({ success: false, error: "Invalid email or password" });
    
    renderLogin();
    const user = userEvent.setup();
    
    await user.type(screen.getByLabelText(/Email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/Password/i), "WrongPass123!");
    await user.click(screen.getByRole("button", { name: /Sign In/i }));
    
    expect(mockLogin).toHaveBeenCalledWith("test@example.com", "WrongPass123!");
    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
  });

  it("disables inputs during busy state", async () => {
    // Return a promise that doesn't resolve immediately to simulate loading
    let resolveLogin: any;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    mockLogin.mockReturnValueOnce(loginPromise);
    
    renderLogin();
    const user = userEvent.setup();
    
    const emailInput = screen.getByLabelText(/Email address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole("button", { name: /Sign In/i });
    
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "Pass123!");
    
    // Fire and forget
    user.click(submitBtn);
    
    // While loading:
    expect(await screen.findByText(/Signing in.../i)).toBeInTheDocument();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    
    // Resolve promise to clean up
    resolveLogin({ success: true });
  });
});
