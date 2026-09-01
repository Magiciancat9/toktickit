import { useState } from "react";
import { useRequester } from "./context/RequesterContext.js";
import { RequesterSelector } from "./components/RequesterSelector.js";
import { AppShell } from "./components/AppShell.js";
import { MyTickets } from "./components/MyTickets.js";
import { CreateTicket } from "./components/CreateTicket.js";
import { TicketDetail } from "./components/TicketDetail.js";

type Page =
  | { name: "my-tickets" }
  | { name: "create-ticket" }
  | { name: "ticket-detail"; ticketNumber: string };

export default function App() {
  const { currentRequester } = useRequester();
  const [page, setPage] = useState<Page>({ name: "my-tickets" });

  // Gate: no requester selected → show selector screen
  if (!currentRequester) {
    return <RequesterSelector />;
  }

  return (
    <AppShell
      activePage={page.name === "ticket-detail" ? "my-tickets" : page.name}
      onNavigate={(p) => setPage({ name: p })}
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
