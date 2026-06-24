import { useEffect, useState } from "react";
import client from "../api/client";

interface Campaign {
  id: string;
  name: string;
  workflowId: string;
  status: string;
  sentCount: number;
  totalCount: number;
  createdAt: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmLaunch, setConfirmLaunch] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", workflowId: "", contactList: "" });

  const tenantId = localStorage.getItem("tenantId") || "";

  const load = () => {
    client.get("/api/campaigns", { params: { tenantId } }).then((r) => setCampaigns(r.data));
  };

  useEffect(() => { if (tenantId) load(); }, [tenantId]);

  const create = async () => {
    const contacts = form.contactList
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    await client.post("/api/campaigns", {
      tenantId,
      name: form.name,
      workflowId: form.workflowId,
      contactList: contacts,
    });
    setShowCreate(false);
    setForm({ name: "", workflowId: "", contactList: "" });
    load();
  };

  const launch = async (id: string) => {
    await client.post(`/api/campaigns/${id}/launch`, { tenantId });
    setConfirmLaunch(null);
    load();
  };

  const progress = (c: Campaign) =>
    c.totalCount > 0 ? Math.round((c.sentCount / c.totalCount) * 100) : 0;

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      draft: "bg-gray-200 text-gray-700",
      launching: "bg-blue-100 text-blue-700",
      completed: "bg-emerald-100 text-emerald-700",
      failed: "bg-red-100 text-red-700",
    };
    return map[s] || "bg-gray-100";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-slate-800 text-white text-sm px-4 py-1.5 rounded hover:bg-slate-700"
        >
          + New Campaign
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Workflow</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Progress</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-500">{c.workflowId}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(c.status)}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-slate-700 h-2 rounded-full transition-all"
                        style={{ width: `${progress(c)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-16 text-right">
                      {c.sentCount}/{c.totalCount}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {c.status === "draft" && (
                    <button
                      onClick={() => setConfirmLaunch(c.id)}
                      className="text-xs bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700"
                    >
                      Launch
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">New Campaign</h2>
            <input
              placeholder="Campaign name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="Workflow ID"
              value={form.workflowId}
              onChange={(e) => setForm({ ...form, workflowId: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Contact list (one phone per line)
              </label>
              <textarea
                rows={5}
                placeholder="+5511999999999&#10;+5511888888888"
                value={form.contactList}
                onChange={(e) => setForm({ ...form, contactList: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm font-mono"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="text-sm px-4 py-1.5 rounded border">Cancel</button>
              <button onClick={create} className="bg-slate-800 text-white text-sm px-4 py-1.5 rounded hover:bg-slate-700">Create</button>
            </div>
          </div>
        </div>
      )}

      {confirmLaunch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmLaunch(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Launch Campaign</h2>
            <p className="text-sm text-gray-600">Are you sure you want to launch this campaign?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmLaunch(null)} className="text-sm px-4 py-1.5 rounded border">Cancel</button>
              <button onClick={() => launch(confirmLaunch)} className="bg-emerald-600 text-white text-sm px-4 py-1.5 rounded hover:bg-emerald-700">Launch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
