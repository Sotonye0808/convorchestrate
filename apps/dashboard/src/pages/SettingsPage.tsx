import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import client from "../api/client";

export default function SettingsPage() {
  const [config, setConfig] = useState("{}");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [demoPhone, setDemoPhone] = useState("");
  const [demoText, setDemoText] = useState("");
  const [demoResult, setDemoResult] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState("");

  const tenantId = localStorage.getItem("tenantId") || "";

  useEffect(() => {
    if (!tenantId) return;
    client
      .get("/api/settings/tenant", { params: { tenantId } })
      .then((r) => setConfig(JSON.stringify(r.data, null, 2)))
      .catch(() => {});
  }, [tenantId]);

  const save = async () => {
    try {
      const parsed = JSON.parse(config);
      setError("");
      await client.put("/api/settings/tenant", { tenantId, config: parsed });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Invalid JSON");
    }
  };

  const toggleDemoMode = async () => {
    try {
      const current = JSON.parse(config);
      const cfg = current.config || {};
      cfg.demo_mode = !cfg.demo_mode;
      current.config = cfg;
      setConfig(JSON.stringify(current, null, 2));
      await client.put("/api/settings/tenant", { tenantId, config: current });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to toggle demo mode");
    }
  };

  const sendDemoMessage = async () => {
    if (!demoPhone || !demoText) return;
    setDemoResult("sending...");
    try {
      const res = await client.post("/api/demo/message", {
        tenantId,
        phone: demoPhone,
        text: demoText,
      });
      setDemoResult(`Sent! Session: ${res.data.sessionId}, Trace: ${res.data.traceId}`);
    } catch (err: any) {
      setDemoResult(`Error: ${err?.response?.data?.message || err.message}`);
    }
  };

  const runSeed = async () => {
    setSeeding(true);
    setSeedResult("");
    try {
      const res = await client.post("/api/demo/seed");
      const data = res.data;
      localStorage.setItem("tenantId", data.tenantId);
      setSeedResult(`Tenant: ${data.tenantId}\nEmail: ${data.adminEmail}\nPassword: ${data.adminPassword}`);
      const tenantRes = await client.get("/api/settings/tenant", { params: { tenantId: data.tenantId } });
      setConfig(JSON.stringify(tenantRes.data, null, 2));
    } catch (err: any) {
      setSeedResult(`Error: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const isDemoMode = () => {
    try {
      const parsed = JSON.parse(config);
      return parsed?.config?.demo_mode === true;
    } catch {
      return false;
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="bg-white rounded-xl shadow p-5 space-y-4">
        <h2 className="font-semibold">Tenant Configuration</h2>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {saved && <div className="text-emerald-600 text-sm">Saved successfully</div>}
        <Editor
          height={400}
          defaultLanguage="json"
          value={config}
          onChange={(v) => setConfig(v || "{}")}
          theme="vs-dark"
          options={{ minimap: { enabled: false }, fontSize: 13 }}
        />
        <div className="flex gap-3">
          <button
            onClick={save}
            className="bg-slate-800 text-white text-sm px-4 py-1.5 rounded hover:bg-slate-700"
          >
            Save
          </button>
          <button
            onClick={toggleDemoMode}
            className={`text-sm px-4 py-1.5 rounded border ${
              isDemoMode()
                ? "bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
                : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {isDemoMode() ? "Disable Demo Mode" : "Enable Demo Mode"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-5 space-y-3">
        <h2 className="font-semibold">WhatsApp QR Code</h2>
        <p className="text-sm text-gray-600">
          To link a WhatsApp session, scan the QR code exposed via the SSE stream at{" "}
          <code className="bg-slate-100 px-1 rounded">GET /api/qr/:sessionId/stream</code>.
        </p>
        <p className="text-sm text-gray-600">
          Provide the <strong>sessionId</strong> and connect using any SSE client to receive
          the QR image payload, then scan it with WhatsApp on your phone.
        </p>
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-8 text-center text-sm text-gray-400">
          QR code display area — connect to the SSE stream to render live QR
        </div>
      </div>

      {isDemoMode() && (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-xl shadow p-5 space-y-3">
            <h2 className="font-semibold text-amber-800">Demo Mode — Simulate Message</h2>
            <p className="text-sm text-amber-700">
              Inject a test message into the system to trigger workflows without a real WhatsApp connection.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Phone (e.g. 5511999999999)"
                className="flex-1 border border-amber-300 rounded px-3 py-1.5 text-sm"
                value={demoPhone}
                onChange={(e) => setDemoPhone(e.target.value)}
              />
              <input
                type="text"
                placeholder="Message text"
                className="flex-1 border border-amber-300 rounded px-3 py-1.5 text-sm"
                value={demoText}
                onChange={(e) => setDemoText(e.target.value)}
              />
              <button
                onClick={sendDemoMessage}
                className="bg-amber-600 text-white text-sm px-4 py-1.5 rounded hover:bg-amber-500"
              >
                Send
              </button>
            </div>
            {demoResult && (
              <pre className="text-xs text-amber-800 bg-amber-100 rounded p-2 whitespace-pre-wrap">
                {demoResult}
              </pre>
            )}
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl shadow p-5 space-y-3">
            <h2 className="font-semibold text-emerald-800">Seed Demo Data</h2>
            <p className="text-sm text-emerald-700">
              Create a demo tenant, workflow, and admin user with one click.
            </p>
            <button
              onClick={runSeed}
              disabled={seeding}
              className="bg-emerald-600 text-white text-sm px-4 py-1.5 rounded hover:bg-emerald-500 disabled:opacity-50"
            >
              {seeding ? "Seeding..." : "Seed Demo Data"}
            </button>
            {seedResult && (
              <pre className="text-xs text-emerald-800 bg-emerald-100 rounded p-2 whitespace-pre-wrap">
                {seedResult}
              </pre>
            )}
          </div>
        </>
      )}
    </div>
  );
}
