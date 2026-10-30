import { jsx as _jsx } from "react/jsx-runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.js";
const mocks = vi.hoisted(() => ({
    user: null,
    fetchRequesterDashboard: vi.fn(),
    fetchStaffDashboard: vi.fn(),
}));
vi.mock("../../src/context/AuthContext.js", () => ({
    useAuth: () => ({ user: mocks.user, logout: vi.fn() }),
}));
vi.mock("../../src/api.js", () => ({
    fetchRequesterDashboard: mocks.fetchRequesterDashboard,
    fetchStaffDashboard: mocks.fetchStaffDashboard,
}));
vi.mock("../../src/components/MyTickets.js", () => ({ MyTickets: () => null }));
vi.mock("../../src/components/CreateTicket.js", () => ({ CreateTicket: () => null }));
vi.mock("../../src/components/TicketDetail.js", () => ({ TicketDetail: () => null }));
vi.mock("../../src/components/StaffTicketQueue.js", () => ({ default: () => null }));
vi.mock("../../src/components/StaffTicketDetail.js", () => ({ StaffTicketDetail: () => null }));
vi.mock("../../src/components/UserManagement.js", () => ({ UserManagement: () => null }));
describe("Dashboard navigation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.fetchRequesterDashboard.mockResolvedValue({
            totalOpen: 0,
            waitingForRequester: 0,
            recentlyUpdated: 0,
            recentlyResolved: 0,
        });
        mocks.fetchStaffDashboard.mockResolvedValue({
            unassigned: 0,
            myAssigned: 0,
            recentlyUpdated: 0,
            highPriorityUnresolved: 0,
            byStatus: {
                NEW: 0,
                OPEN: 0,
                IN_PROGRESS: 0,
                WAITING_FOR_REQUESTER: 0,
                RESOLVED: 0,
                REOPENED: 0,
            },
            byPriority: { LOW: 0, MEDIUM: 0, HIGH: 0 },
        });
    });
    it.each([
        ["REQUESTER", "Dashboard"],
        ["IT_STAFF", "IT Staff Dashboard"],
        ["ADMINISTRATOR", "IT Staff Dashboard"],
    ])("opens the %s user's role-appropriate dashboard", async (role, title) => {
        mocks.user = {
            id: 1,
            name: "Test User",
            email: "test@example.com",
            role,
            requiresPasswordChange: false,
        };
        render(_jsx(App, {}));
        await userEvent.click(await screen.findByTestId("nav-dashboard"));
        expect(await screen.findByRole("heading", { name: title })).toBeInTheDocument();
        if (role === "REQUESTER") {
            expect(mocks.fetchRequesterDashboard).toHaveBeenCalledOnce();
        }
        else {
            expect(mocks.fetchStaffDashboard).toHaveBeenCalledOnce();
        }
    });
});
