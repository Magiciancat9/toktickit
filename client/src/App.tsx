import { useState } from "react";
import { useAuth } from "./context/AuthContext.js";
import { Login } from "./components/Login.js";
import { ChangePassword } from "./components/ChangePassword.js";
import { AppShell } from "./components/AppShell.js";
import { MyTickets } from "./components/MyTickets.js";
import { CreateTicket } from "./components/CreateTicket.js";
import { TicketDetail } from "./components/TicketDetail.js";

type Page =
  | { name: "my-tickets" }
  | { name: "create-ticket" }
  | { name: "ticket-detail"; ticketNumber: string };

export default function App() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>({ name: "my-tickets" });

  // Loading state during initial auth check
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F5F7F6",
        }}
      >
        <div style={{ fontSize: "18px", color: "#2C3E37" }}>Loading...</div>
      </div>
    );
  }

  // Not authenticated → show login
  if (!user) {
    return <Login />;
  }

  // Authenticated but must change password → show password change screen
  if (user.requiresPasswordChange) {
    return <ChangePassword />;
  }

  // Authenticated and ready → show main app
  // For Lab 3 authentication issue, we only support Requester role for now
  // IT Staff and Administrator workflows will be added in subsequent issues
  return (
    <AppShell
      activePage={page.name === "ticket-detail" ? "my-tickets" : page.name}
      onNavigate={(p) => {
        if (p === "my-tickets") {
          setPage({ name: "my-tickets" });
        } else if (p === "create-ticket") {
          setPage({ name: "create-ticket" });
        }
      }}
    >
      {page.name === "create-ticket" ? (
        <CreateTicket onCancel={() => setPage({ name: "my-tickets" })} />
      ) : page.name === "ticket-detail" ? (
        <TicketDetail
          ticketNumber={page.ticketNumber}
          onBack={() => setPage({ name: "my-tickets" })}
        />
      ) : (
        <MyTickets
          onCreateTicket={() => setPage({ name: "create-ticket" })}
          onOpenTicket={(ticketNumber) =>
            setPage({ name: "ticket-detail", ticketNumber })
          }
        />
      )}
    </AppShell>
  );
}
