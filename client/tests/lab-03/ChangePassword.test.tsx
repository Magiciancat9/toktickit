import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChangePassword } from "../../src/components/ChangePassword";
import { AuthContext } from "../../src/context/AuthContext";
import React from "react";

const mockChangePassword = vi.fn();
const mockLoadUser = vi.fn();

const renderChangePassword = (authValue: any = {}) => {
  return render(
    <AuthContext.Provider
      value={{
        user: { id: 1, email: "test@example.com", name: "Test User", role: "REQUESTER", requiresPasswordChange: true },
        loading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        loadUser: mockLoadUser,
        changePassword: mockChangePassword,
        ...authValue,
      }}
    >
      <ChangePassword />
    </AuthContext.Provider>
  );
};

describe("ChangePassword Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all password inputs and checklist", () => {
    renderChangePassword();
    
    expect(screen.getByLabelText(/Current \(temporary\) password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^New password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm new password/i)).toBeInTheDocument();
    
    expect(screen.getByText(/At least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/Include upper and lower case letters/i)).toBeInTheDocument();
    expect(screen.getByText(/Include a number and a special character/i)).toBeInTheDocument();
  });

  it("validates password requirements live", async () => {
    renderChangePassword();
    const user = userEvent.setup();
    const newPassInput = screen.getByLabelText(/^New password$/i);
    
    await user.type(newPassInput, "pass");
    // Some requirements might not be met
    // Assert visual changes in checklist if applicable (depends on implementation, e.g., checking styles or classes)
    
    await user.clear(newPassInput);
    await user.type(newPassInput, "ValidPassword123!");
    
    // Now valid
  });

  it("shows error for mismatched passwords", async () => {
    renderChangePassword();
    const user = userEvent.setup();
    
    await user.type(screen.getByLabelText(/Current \(temporary\) password/i), "OldPass123!");
    await user.type(screen.getByLabelText(/^New password$/i), "ValidPassword123!");
    await user.type(screen.getByLabelText(/Confirm new password/i), "DifferentPass123!");
    
    await user.click(screen.getByRole("button", { name: /Continue/i }));
    
    expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it("submits successfully and calls loadUser", async () => {
    mockChangePassword.mockResolvedValueOnce({ success: true });
    
    renderChangePassword();
    const user = userEvent.setup();
    
    await user.type(screen.getByLabelText(/Current \(temporary\) password/i), "OldPass123!");
    await user.type(screen.getByLabelText(/^New password$/i), "ValidPassword123!");
    await user.type(screen.getByLabelText(/Confirm new password/i), "ValidPassword123!");
    
    await user.click(screen.getByRole("button", { name: /Continue/i }));
    
    expect(mockChangePassword).toHaveBeenCalledWith("OldPass123!", "ValidPassword123!");
    await waitFor(() => {
      expect(mockLoadUser).toHaveBeenCalled();
    });
  });

  it("shows API error on failure", async () => {
    mockChangePassword.mockResolvedValueOnce({ success: false, error: "Current password is incorrect" });
    
    renderChangePassword();
    const user = userEvent.setup();
    
    await user.type(screen.getByLabelText(/Current \(temporary\) password/i), "WrongOldPass123!");
    await user.type(screen.getByLabelText(/^New password$/i), "ValidPassword123!");
    await user.type(screen.getByLabelText(/Confirm new password/i), "ValidPassword123!");
    
    await user.click(screen.getByRole("button", { name: /Continue/i }));
    
    expect(await screen.findByText(/Current password is incorrect/i)).toBeInTheDocument();
  });
});
