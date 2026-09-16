import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import { useAuth } from "./context/AuthContext.js";
import { Login } from "./components/Login.js";
import { ChangePassword } from "./components/ChangePassword.js";
import { AppShell } from "./components/AppShell.js";
import { MyTickets } from "./components/MyTickets.js";
import { CreateTicket } from "./components/CreateTicket.js";
import { TicketDetail } from "./components/TicketDetail.js";
import StaffTicketQueue from "./components/StaffTicketQueue.js";
import { StaffTicketDetail } from "./components/StaffTicketDetail.js";
export default function App() {
    const { user, loading } = useAuth();
    // Default page based on role
    const getDefaultPage = () => {
        if (user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR") {
            return { name: "staff-queue" };
        }
        return { name: "my-tickets" };
    };
    const [page, setPage] = useState(getDefaultPage());
    // Loading state during initial auth check
    if (loading) {
        return (_jsx("div", { style: {
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#F5F7F6",
            }, children: _jsx("div", { style: { fontSize: "18px", color: "#2C3E37" }, children: "Loading..." }) }));
    }
    // Not authenticated → show login
    if (!user) {
        return _jsx(Login, {});
    }
    // Authenticated but must change password → show password change screen
    if (user.requiresPasswordChange) {
        return _jsx(ChangePassword, {});
    }
    // Authenticated and ready → show main app
    return (_jsx(AppShell, { activePage: page.name === "ticket-detail" || page.name === "staff-ticket-detail"
            ? user.role === "REQUESTER"
                ? "my-tickets"
                : "staff-queue"
            : page.name, onNavigate: (p) => {
            if (p === "my-tickets") {
                setPage({ name: "my-tickets" });
            }
            else if (p === "create-ticket") {
                setPage({ name: "create-ticket" });
            }
            else if (p === "staff-queue") {
                setPage({ name: "staff-queue" });
            }
        }, children: page.name === "create-ticket" && user.role === "REQUESTER" ? (_jsx(CreateTicket, { onCancel: () => setPage({ name: "my-tickets" }) })) : page.name === "ticket-detail" && user.role === "REQUESTER" ? (_jsx(TicketDetail, { ticketNumber: page.ticketNumber, onBack: () => setPage({ name: "my-tickets" }) })) : page.name === "my-tickets" && user.role === "REQUESTER" ? (_jsx(MyTickets, { onCreateTicket: () => setPage({ name: "create-ticket" }), onOpenTicket: (ticketNumber) => setPage({ name: "ticket-detail", ticketNumber }) })) : /* IT Staff / Admin pages */
            page.name === "staff-queue" && (user.role === "IT_STAFF" || user.role === "ADMINISTRATOR") ? (_jsx(StaffTicketQueue, { onOpenTicket: (ticketNumber) => setPage({ name: "staff-ticket-detail", ticketNumber }) })) : page.name === "staff-ticket-detail" && (user.role === "IT_STAFF" || user.role === "ADMINISTRATOR") ? (_jsx(StaffTicketDetail, { ticketNumber: page.ticketNumber, onBack: () => setPage({ name: "staff-queue" }) })) : (
            /* Fallback */
            _jsx("div", { style: { padding: "40px", textAlign: "center" }, children: _jsx("p", { style: { fontSize: "18px", color: "#2C3E37" }, children: "Page not found or access denied." }) })) }));
}
