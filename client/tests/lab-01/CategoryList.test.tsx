import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import CategoryList from "../../src/components/CategoryList.js";
import * as api from "../../src/api.js";

const MOCK_CATEGORIES = [
  { id: 1, name: "Account and Access" },
  { id: 2, name: "Hardware" },
  { id: 3, name: "Network" },
  { id: 4, name: "Software" },
];

describe("CategoryList component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a loading state while the request is in flight", () => {
    // Never resolves during this test — keeps the component in loading state
    vi.spyOn(api, "fetchCategories").mockReturnValue(new Promise(() => {}));

    render(<CategoryList />);

    expect(screen.getByTestId("categories-loading")).toBeInTheDocument();
    expect(screen.getByTestId("categories-loading")).toHaveTextContent("Loading categories...");
  });

  it("renders category names in the order returned by the API", async () => {
    vi.spyOn(api, "fetchCategories").mockResolvedValue(MOCK_CATEGORIES);

    render(<CategoryList />);

    // Loading shows first
    expect(screen.getByTestId("categories-loading")).toBeInTheDocument();

    // Then the list appears
    await waitFor(() => {
      expect(screen.getByTestId("categories-list")).toBeInTheDocument();
    });

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent("Account and Access");
    expect(items[1]).toHaveTextContent("Hardware");
    expect(items[2]).toHaveTextContent("Network");
    expect(items[3]).toHaveTextContent("Software");
  });

  it("shows an error state when the API call fails", async () => {
    vi.spyOn(api, "fetchCategories").mockRejectedValue(new Error("Network error"));

    render(<CategoryList />);

    await waitFor(() => {
      expect(screen.getByTestId("categories-error")).toBeInTheDocument();
    });

    expect(screen.getByTestId("categories-error")).toHaveTextContent(
      "Unable to load categories. Please try again later."
    );
  });

  it("shows an error state when the API returns a non-200 response", async () => {
    vi.spyOn(api, "fetchCategories").mockRejectedValue(
      new Error("Failed to load categories: 500")
    );

    render(<CategoryList />);

    await waitFor(() => {
      expect(screen.getByTestId("categories-error")).toBeInTheDocument();
    });

    expect(screen.getByTestId("categories-error")).toHaveTextContent(
      "Unable to load categories. Please try again later."
    );
  });
});
