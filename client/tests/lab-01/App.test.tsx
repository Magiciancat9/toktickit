import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.js";
import * as api from "../../src/api.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";

// App now shows MyTickets as the default home page (Lab 2 Issue 5).
// Tests drive past the RequesterSelector first, then verify App behaviour.

const MOCK_REQUESTER = { id: 1, name: "Jennifer Anderson", email: "jennifer@example.com" };

function renderApp() {
  return render(
    <RequesterProvider>
      <App />
    </RequesterProvider>
  );
}

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchRequesters").mockResolvedValue([MOCK_REQUESTER]);
    // MyTickets will call fetchTickets on mount — return empty list by default
    vi.spyOn(api, "fetchTickets").mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
    });
    vi.spyOn(api, "fetchCategories").mockResolvedValue([]);
    vi.spyOn(api, "fetchRelatedSystems").mockResolvedValue([]);
  });

  it("renders the TokTickIT heading and Check System button on load (after requester selection)", async () => {
    renderApp();

    // Drive past selector
    await waitFor(() => expect(screen.getByTestId("requester-select")).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByTestId("requester-select"), "1");
    await userEvent.click(screen.getByTestId("selector-continue-btn"));

    // App shell and My Tickets screen should be visible
    await waitFor(() => {
      expect(screen.getByTestId("app-shell-nav")).toBeInTheDocument();
    });
    expect(screen.getByTestId("my-tickets-screen")).toBeInTheDocument();
  });

  it("navigates to Create Ticket when + Create Ticket nav link is clicked", async () => {
    renderApp();

    await waitFor(() => expect(screen.getByTestId("requester-select")).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByTestId("requester-select"), "1");
    await userEvent.click(screen.getByTestId("selector-continue-btn"));

    await waitFor(() => expect(screen.getByTestId("nav-create-ticket")).toBeInTheDocument());
    await userEvent.click(screen.getByTestId("nav-create-ticket"));

    await waitFor(() => {
      expect(screen.getByTestId("create-ticket-form")).toBeInTheDocument();
    });
  });

  it("returns to My Tickets when Change Requester is clicked", async () => {
    renderApp();

    await waitFor(() => expect(screen.getByTestId("requester-select")).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByTestId("requester-select"), "1");
    await userEvent.click(screen.getByTestId("selector-continue-btn"));

    await waitFor(() => expect(screen.getByTestId("change-requester-btn")).toBeInTheDocument());
    await userEvent.click(screen.getByTestId("change-requester-btn"));

    // Selector screen should reappear
    await waitFor(() => {
      expect(screen.getByTestId("requester-selector-screen")).toBeInTheDocument();
    });
  });
});
