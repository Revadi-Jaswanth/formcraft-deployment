import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import ThemeSelector from "../components/profile/ThemeSelector";
import NotificationSettings from "../components/profile/NotificationSettings";
import ChangePasswordDialog from "../components/profile/ChangePasswordDialog";
import DeleteAccountDialog from "../components/profile/DeleteAccountDialog";

// Mock useAuth hook from contexts/AuthContext
vi.mock("../contexts/AuthContext", () => {
  return {
    useAuth: () => ({
      logout: vi.fn(),
      currentUser: { id: "user-123", email: "test@example.com", name: "Tester" },
    }),
  };
});

describe("Profile & Settings Components", () => {
  it("renders ThemeSelector and responds to choice changes", () => {
    const mockChange = vi.fn();
    render(<ThemeSelector value="dark" onChange={mockChange} />);

    // Check theme buttons
    expect(screen.getByText("Light Theme")).toBeDefined();
    expect(screen.getByText("Dark Theme")).toBeDefined();
    expect(screen.getByText("System Default")).toBeDefined();

    const lightButton = screen.getByRole("button", { name: /Light Theme/i });
    fireEvent.click(lightButton);
    expect(mockChange).toHaveBeenCalledWith("light");
  });

  it("renders NotificationSettings switches", () => {
    const mockChange = vi.fn();
    const mockValues = {
      email_notifications: true,
      submission_alerts: false,
    };
    render(<NotificationSettings value={mockValues} onChange={mockChange} />);

    expect(screen.getByText("Email Notifications")).toBeDefined();
    expect(screen.getByText("Submission Alerts")).toBeDefined();
  });

  it("renders ChangePasswordDialog and validates input elements", () => {
    render(<ChangePasswordDialog isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByPlaceholderText("Enter current password")).toBeDefined();
    expect(screen.getByPlaceholderText("At least 8 characters")).toBeDefined();
    expect(screen.getByRole("button", { name: /Save Password/i })).toBeDefined();
  });

  it("renders DeleteAccountDialog and prompts confirm key checks", () => {
    render(<DeleteAccountDialog isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByPlaceholderText("DELETE")).toBeDefined();
    expect(screen.getByRole("button", { name: /Delete Workspace/i })).toBeDefined();
  });
});
