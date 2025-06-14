import React, { useState } from "react";
import { runMultiAgent } from "../services/api";

const AGENT_OPTIONS = ["PPO", "DQN", "A2C"];

export default function MultiAgentControls() {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions, (o) => o.value);
    setSelected(options);
  };

  const handleRun = async () => {
    const res = await runMultiAgent(selected);
    setResult(res);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <label>Select agents:&nbsp;</label>
      <select multiple value={selected} onChange={handleChange} style={{ minWidth: 120 }}>
        {AGENT_OPTIONS.map((agent) => (
          <option key={agent} value={agent}>{agent}</option>
        ))}
      </select>
      <button onClick={handleRun} disabled={selected.length === 0} style={{ marginLeft: 12 }}>
        Run Multi-Agent
      </button>
      {result && (
        <pre style={{ maxHeight: 200, overflow: "auto", marginTop: 16 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}