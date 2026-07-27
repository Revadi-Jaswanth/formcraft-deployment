import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import ResponseDetailsDialog from "../components/forms/ResponseDetailsDialog";

describe("Responses Polish Components", () => {
  const mockSubmission = {
    id: "sub-12345",
    submitted_at: "2026-07-24T12:00:00Z",
    ip_address: "192.168.1.100",
    completion_time_seconds: 45,
    response_values: [
      { field_id: "field-1", value: "Jane Doe" },
      { field_id: "field-2", value: '["Apple", "Banana"]' },
    ],
  };

  const mockFields = [
    { id: "field-1", label: "Full Name" },
    { id: "field-2", label: "Favorite Fruit" },
  ];

  it("renders ResponseDetailsDialog with data", () => {
    const mockClose = vi.fn();
    const mockDelete = vi.fn();

    render(
      <ResponseDetailsDialog
        submission={mockSubmission}
        fields={mockFields}
        isOpen={true}
        onClose={mockClose}
        onDelete={mockDelete}
      />
    );

    expect(screen.getByText("sub-12345")).toBeDefined();
    expect(screen.getByText("Jane Doe")).toBeDefined();
    expect(screen.getByText("Favorite Fruit")).toBeDefined();
  });
});
