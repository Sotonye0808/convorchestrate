import { useEffect, useState } from "react";
import client from "../api/client";

interface Contact {
  id: string;
  phone: string;
  name?: string;
  tags?: { id: string; name: string }[];
  createdAt: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const limit = 20;

  const tenantId = localStorage.getItem("tenantId") || "";

  const load = () => {
    client
      .get("/api/contacts", { params: { tenantId, search, page, limit } })
      .then((r) => {
        setContacts(r.data.data);
        setTotal(r.data.total);
      })
      .catch(() => {});
  };

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { load(); }, [tenantId, page, search]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Contacts</h1>
      <input
        type="text"
        placeholder="Search contacts…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded px-3 py-2 text-sm w-full max-w-sm mb-4 focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {contacts.map((c) => (
              <>
                <tr
                  key={c.id}
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="px-4 py-3">{c.phone}</td>
                  <td className="px-4 py-3">{c.name || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {(c.tags ?? []).slice(0, 3).map((t) => (
                        <span key={t.id} className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">
                          {t.name}
                        </span>
                      ))}
                      {(c.tags ?? []).length > 3 && (
                        <span className="text-xs text-gray-400">+{c.tags!.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                </tr>
                {expanded === c.id && (
                  <tr key={`${c.id}-expanded`}>
                    <td colSpan={4} className="px-4 py-3 bg-gray-50">
                      <div className="text-xs text-gray-600 space-y-1">
                        <div><span className="font-medium">ID:</span> {c.id}</div>
                        <div>
                          <span className="font-medium">All tags:</span>{" "}
                          {(c.tags ?? []).map((t) => (
                            <span key={t.id} className="inline-block bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full mr-1">
                              {t.name}
                            </span>
                          ))}
                          {(c.tags ?? []).length === 0 && "None"}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-4 text-sm">
        <span className="text-gray-500">
          Page {page} of {totalPages} ({total} total)
        </span>
        <div className="flex gap-1">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-slate-100"
          >
            Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const start = Math.max(1, page - 3);
            const p = start + i;
            if (p > totalPages) return null;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 rounded border ${
                  p === page ? "bg-slate-800 text-white" : "hover:bg-slate-100"
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-slate-100"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
