import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import StatsCards from "../components/dashboard/StatsCards";
import EmptyState from "../components/dashboard/EmptyState";
import SkeletonCard from "../components/dashboard/SkeletonCard";

// Mock useNavigate hook from react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Dashboard Workspace Components", () => {
  const dummyForms = [
    { id: "1", title: "Customer Feedback", status: "published", submission_count: 5 },
    { id: "2", title: "Employee Survey", status: "draft", submission_count: 0 },
    { id: "3", title: "Job Application", status: "archived", submission_count: 12 },
  ];

  it("renders StatsCards correctly with telemetry values", () => {
    render(
      <BrowserRouter>
        <StatsCards forms={dummyForms} />
      </BrowserRouter>
    );

    // Assert that titles and values are displayed
    expect(screen.getByText("Total Forms")).toBeDefined();
    expect(screen.getByText("Published Forms")).toBeDefined();
    expect(screen.getByText("Draft Forms")).toBeDefined();
    expect(screen.getByText("Archived Forms")).toBeDefined();

    // Verify click triggers navigation route
    const totalFormsButton = screen.getByRole("button", { name: /Total Forms/i });
    fireEvent.click(totalFormsButton);
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/forms");
  });

  it("renders EmptyState component with title and CTA", () => {
    const mockAction = vi.fn();
    render(
      <EmptyState
        title="No forms yet"
        description="Create your first form template"
        action={{ label: "Add New Form", onClick: mockAction }}
      />
    );

    expect(screen.getByText("No forms yet")).toBeDefined();
    expect(screen.getByText("Create your first form template")).toBeDefined();

    const actionButton = screen.getByRole("button", { name: /Add New Form/i });
    fireEvent.click(actionButton);
    expect(mockAction).toHaveBeenCalled();
  });

  it("renders SkeletonCard types without crashing", () => {
    const { container: container1 } = render(<SkeletonCard type="stats" />);
    expect(container1.querySelector(".animate-pulse")).toBeDefined();

    const { container: container2 } = render(<SkeletonCard type="table" />);
    expect(container2.querySelector(".animate-pulse")).toBeDefined();
  });
});
