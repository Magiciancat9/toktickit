import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext.js";
import { Login } from "./components/Login.js";
import { ChangePassword } from "./components/ChangePassword.js";
import { AppShell } from "./components/AppShell";
import { MyTickets } from "./components/MyTickets.js";
import { CreateTicket } from "./components/CreateTicket.js";
import { TicketDetail } from "./components/TicketDetail.js";
import StaffTicketQueue from "./components/StaffTicketQueue.js";
import { StaffTicketDetail } from "./components/StaffTicketDetail.js";
import { UserManagement } from "./components/UserManagement.js";

type Page =
  | { name: "my-tickets" }
  | { name: "create-ticket" }
  | { name: "ticket-detail"; ticketNumber: string }
  | { name: "staff-queue" }
  | { name: "staff-ticket-detail"; ticketNumber: string }
  | { name: "user-management" };

export default function App() {
  const { user, loading } = useAuth();
  
  // Default page based on role
  const getDefaultPage = (): Page => {
    if (user?.role === "ADMINISTRATOR") {
      return { name: "user-management" };
    }
    if (user?.role === "IT_STAFF") {
      return { name: "staff-queue" };
    }
    return { name: "my-tickets" };
  };
  
  const [page, setPage] = useState<Page>(getDefaultPage());

  useEffect(() => {
    if (user) {
      setPage(getDefaultPage());
    }
  }, [user?.id, user?.role]);

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
  return (
    <AppShell
      activePage={
        page.name === "ticket-detail" || page.name === "staff-ticket-detail"
          ? user.role === "REQUESTER"
            ? "my-tickets"
            : "staff-queue"
          : page.name
      }
      onNavigate={(p) => {
        if (p === "my-tickets") {
          setPage({ name: "my-tickets" });
        } else if (p === "create-ticket") {
          setPage({ name: "create-ticket" });
        } else if (p === "staff-queue") {
          setPage({ name: "staff-queue" });
        } else if (p === "user-management") {
          setPage({ name: "user-management" });
        }
      }}
    >
      {/* Requester pages */}
      {page.name === "create-ticket" && user.role === "REQUESTER" ? (
        <CreateTicket onCancel={() => setPage({ name: "my-tickets" })} />
      ) : page.name === "ticket-detail" && user.role === "REQUESTER" ? (
        <TicketDetail
          ticketNumber={page.ticketNumber}
          onBack={() => setPage({ name: "my-tickets" })}
        />
      ) : page.name === "my-tickets" && user.role === "REQUESTER" ? (
        <MyTickets
          onCreateTicket={() => setPage({ name: "create-ticket" })}
          onOpenTicket={(ticketNumber) =>
            setPage({ name: "ticket-detail", ticketNumber })
          }
        />
      ) : /* IT Staff / Admin pages */
      page.name === "staff-queue" && (user.role === "IT_STAFF" || user.role === "ADMINISTRATOR") ? (
        <StaffTicketQueue
          onOpenTicket={(ticketNumber) =>
            setPage({ name: "staff-ticket-detail", ticketNumber })
          }
        />
      ) : page.name === "staff-ticket-detail" && (user.role === "IT_STAFF" || user.role === "ADMINISTRATOR") ? (
        <StaffTicketDetail
          ticketNumber={page.ticketNumber}
          onBack={() => setPage({ name: "staff-queue" })}
        />
      ) : page.name === "user-management" && user.role === "ADMINISTRATOR" ? (
        <UserManagement />
      ) : (
        /* Fallback */
        <div style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ fontSize: "18px", color: "#2C3E37" }}>Page not found or access denied.</p>
        </div>
      )}
    </AppShell>
  );
}
