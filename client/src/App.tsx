import { useState } from "react";
import { useRequester } from "./context/RequesterContext.js";
import { RequesterSelector } from "./components/RequesterSelector.js";
import { AppShell } from "./components/AppShell.js";
import { MyTickets } from "./components/MyTickets.js";
import { CreateTicket } from "./components/CreateTicket.js";

type Page = "my-tickets" | "create-ticket";

export default function App() {
  const { currentRequester } = useRequester();
  const [page, setPage] = useState<Page>("my-tickets");

  // Gate: no requester selected → show selector screen
  if (!currentRequester) {
    return <RequesterSelector />;
  }

  return (
    <AppShell activePage={page} onNavigate={setPage}>
      {page === "create-ticket" ? (
        <CreateTicket onCancel={() => setPage("my-tickets")} />
      ) : (
        <MyTickets onCreateTicket={() => setPage("create-ticket")} />
      )}
    </AppShell>
  );
}
