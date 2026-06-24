import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, type ReactNode } from "react";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/workflows", label: "Workflows" },
  { to: "/contacts", label: "Contacts" },
  { to: "/campaigns", label: "Campaigns" },
  { to: "/logs", label: "Logs" },
  { to: "/settings", label: "Settings" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tenantId, setTenantId] = useState(localStorage.getItem("tenantId") || "");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleTenantChange = (val: string) => {
    setTenantId(val);
    localStorage.setItem("tenantId", val);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-60 bg-slate-800 text-white flex flex-col shrink-0">
        <div className="p-5 text-xl font-bold tracking-wide border-b border-slate-700">
          Convorchestrate
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm font-medium transition ${
                  isActive ? "bg-slate-600 text-white" : "text-slate-300 hover:bg-slate-700"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0">
          <input
            type="text"
            placeholder="Tenant ID"
            value={tenantId}
            onChange={(e) => handleTenantChange(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Logout
          </button>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
