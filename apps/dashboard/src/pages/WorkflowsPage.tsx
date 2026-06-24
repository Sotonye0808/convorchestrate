import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import client from "../api/client";

interface Workflow {
  id: string;
  tenantId: string;
  name: string;
  workflowId: string;
  type: string;
  isActive: boolean;
  config: Record<string, unknown>;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selected, setSelected] = useState<Workflow | null>(null);
  const [json, setJson] = useState("");
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", workflowId: "", type: "default", config: "{}" });

  const tenantId = localStorage.getItem("tenantId") || "";

  const load = () => {
    client.get("/api/workflows", { params: { tenantId } }).then((r) => setWorkflows(r.data));
  };

  useEffect(() => { if (tenantId) load(); }, [tenantId]);

  const select = (wf: Workflow) => {
    setSelected(wf);
    setJson(JSON.stringify(wf, null, 2));
    setError("");
  };

  const save = async () => {
    if (!selected) return;
    try {
      const parsed = JSON.parse(json);
      setError("");
      await client.put(`/api/workflows/${selected.id}`, { config: parsed });
      load();
    } catch {
      setError("Invalid JSON");
    }
  };

  const create = async () => {
    try {
      const config = JSON.parse(createForm.config);
      await client.post("/api/workflows", { ...createForm, tenantId, config });
      setShowCreate(false);
      setCreateForm({ name: "", workflowId: "", type: "default", config: "{}" });
      load();
    } catch {
      setError("Invalid JSON in config");
    }
  };

  const toggleActive = async (wf: Workflow) => {
    await client.put(`/api/workflows/${wf.id}`, { isActive: !wf.isActive });
    load();
  };

  return (
    <div className="flex h-full gap-4">
      <div className="w-96 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Workflows</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded hover:bg-slate-700"
          >
            + New
          </button>
        </div>
        <div className="space-y-2 overflow-auto max-h-[calc(100vh-10rem)]">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              onClick={() => select(wf)}
              className={`cursor-pointer bg-white rounded-lg shadow p-3 border-l-4 transition ${
                selected?.id === wf.id ? "border-slate-800" : "border-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{wf.name}</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{wf.type}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{wf.workflowId}</span>
                <label
                  onClick={(e) => { e.stopPropagation(); toggleActive(wf); }}
                  className={`relative inline-block w-9 h-5 cursor-pointer`}
                >
                  <div
                    className={`w-9 h-5 rounded-full transition ${
                      wf.isActive ? "bg-emerald-500" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition ${
                        wf.isActive ? "translate-x-4" : ""
                      }`}
                    />
                  </div>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="flex-1 bg-white rounded-xl shadow p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{selected.name}</h2>
            <button
              onClick={save}
              className="bg-slate-800 text-white text-sm px-4 py-1.5 rounded hover:bg-slate-700"
            >
              Save
            </button>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Editor
            height="calc(100vh - 14rem)"
            defaultLanguage="json"
            value={json}
            onChange={(v) => setJson(v || "")}
            theme="vs-dark"
            options={{ minimap: { enabled: false }, fontSize: 13 }}
          />
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">New Workflow</h2>
            <input
              placeholder="Name"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="Workflow ID"
              value={createForm.workflowId}
              onChange={(e) => setCreateForm({ ...createForm, workflowId: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="Type"
              value={createForm.type}
              onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <Editor
              height={160}
              defaultLanguage="json"
              value={createForm.config}
              onChange={(v) => setCreateForm({ ...createForm, config: v || "{}" })}
              theme="vs-dark"
              options={{ minimap: { enabled: false }, fontSize: 13 }}
            />
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="text-sm px-4 py-1.5 rounded border">Cancel</button>
              <button onClick={create} className="bg-slate-800 text-white text-sm px-4 py-1.5 rounded hover:bg-slate-700">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
