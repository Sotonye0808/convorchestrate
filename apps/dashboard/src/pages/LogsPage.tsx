import { useEffect, useState } from "react";
import client from "../api/client";

interface LogEvent {
  id: string;
  timestamp: string;
  eventType: string;
  direction: string;
  contactId?: string;
  traceId?: string;
}

export default function LogsPage() {
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [eventType, setEventType] = useState("");
  const [traceId, setTraceId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const limit = 25;

  const tenantId = localStorage.getItem("tenantId") || "";

  const load = () => {
    const params: Record<string, string> = { tenantId, page: String(page), limit: String(limit) };
    if (eventType) params.eventType = eventType;
    if (traceId) params.traceId = traceId;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    client.get("/api/events", { params }).then((r) => {
      setEvents(r.data.data);
      setTotal(r.data.total);
    }).catch(() => {});
  };

  useEffect(() => { setPage(1); }, [eventType, traceId, dateFrom, dateTo]);
  useEffect(() => { load(); }, [tenantId, page, eventType, traceId, dateFrom, dateTo]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Event Logs</h1>
      <div className="bg-white rounded-xl shadow p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Event Type</label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-40"
          >
            <option value="">All</option>
            <option value="message">Message</option>
            <option value="status">Status</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Trace ID</label>
          <input
            type="text"
            placeholder="trace-xxx"
            value={traceId}
            onChange={(e) => setTraceId(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-48"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">Event Type</th>
              <th className="px-4 py-3 font-medium">Direction</th>
              <th className="px-4 py-3 font-medium">Contact ID</th>
              <th className="px-4 py-3 font-medium">Trace ID</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {events.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{new Date(e.timestamp).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">{e.eventType}</span>
                </td>
                <td className="px-4 py-3">{e.direction}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{e.contactId || "—"}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{e.traceId || "—"}</td>
              </tr>
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
