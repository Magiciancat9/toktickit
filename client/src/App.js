import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import { useAuth } from "./context/AuthContext.js";
import { Login } from "./components/Login.js";
import { ChangePassword } from "./components/ChangePassword.js";
import { AppShell } from "./components/AppShell.js";
import { MyTickets } from "./components/MyTickets.js";
import { CreateTicket } from "./components/CreateTicket.js";
import { TicketDetail } from "./components/TicketDetail.js";
export default function App() {
    const { user, loading } = useAuth();
    const [page, setPage] = useState({ name: "my-tickets" });
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
    // For Lab 3 authentication issue, we only support Requester role for now
    // IT Staff and Administrator workflows will be added in subsequent issues
    return (_jsx(AppShell, { activePage: page.name === "ticket-detail" ? "my-tickets" : page.name, onNavigate: (p) => {
            if (p === "my-tickets") {
                setPage({ name: "my-tickets" });
            }
            else if (p === "create-ticket") {
                setPage({ name: "create-ticket" });
            }
        }, children: page.name === "create-ticket" ? (_jsx(CreateTicket, { onCancel: () => setPage({ name: "my-tickets" }) })) : page.name === "ticket-detail" ? (_jsx(TicketDetail, { ticketNumber: page.ticketNumber, onBack: () => setPage({ name: "my-tickets" }) })) : (_jsx(MyTickets, { onCreateTicket: () => setPage({ name: "create-ticket" }), onOpenTicket: (ticketNumber) => setPage({ name: "ticket-detail", ticketNumber }) })) }));
}
