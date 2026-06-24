import { useEffect, useState } from "react";
import client from "../api/client";

interface Stats {
  activeSessions: number;
  totalContacts: number;
  verifiedContacts: number;
  activeCampaigns: number;
}

const cards = [
  { key: "activeSessions", label: "Active Sessions", color: "bg-blue-500" },
  { key: "totalContacts", label: "Total Contacts", color: "bg-emerald-500" },
  { key: "verifiedContacts", label: "Verified Contacts", color: "bg-amber-500" },
  { key: "activeCampaigns", label: "Active Campaigns", color: "bg-purple-500" },
] as const;

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const tenantId = localStorage.getItem("tenantId") || "";
    client
      .get("/api/dashboard/stats", { params: { tenantId } })
      .then((r) => setStats(r.data))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c) => (
          <div key={c.key} className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
            <div className={`w-12 h-12 ${c.color} rounded-lg flex items-center justify-center text-white text-lg font-bold`}>
              {stats ? stats[c.key as keyof Stats] : "—"}
            </div>
            <div>
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="text-2xl font-bold">{stats ? stats[c.key as keyof Stats] : "—"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
