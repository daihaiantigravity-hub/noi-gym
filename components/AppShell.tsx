import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children?: ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell__content">{children}</div>
    </div>
  );
}
