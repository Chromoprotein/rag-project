import { useState, useEffect, useRef } from "react";

interface Fact {
  id: string;
  text: string;
  category: string;
}

function FactsTable() {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [draftFacts, setDraftFacts] = useState<Fact[]>([]);
  const [newFact, setNewFact] = useState<Fact>({
    id: "",
    text: "",
    category: "Character",
  });

  const [saving, setSaving] = useState<{ [index: number]: boolean }>({});

  // Fetch from backend
  const fetchFacts = async () => {
    const res = await fetch("http://localhost:5000/facts");
    const data = await res.json();
    setFacts(data);
    setDraftFacts(data);
  };

  // Add a new fact
  const addFact = async () => {
    if (!newFact.text.trim()) return;

    await fetch("http://localhost:5000/facts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newFact),
    });

    setNewFact({ id: "", text: "", category: "Character" });
    fetchFacts();
  };

  const editFact = (index: number, field: "text" | "category", value: string) => {
    setDraftFacts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const saveFact = async (index: number) => {
    setSaving((prev) => ({ ...prev, [index]: true }));

    const factToSave = draftFacts[index];

    await fetch(`http://localhost:5000/facts/${factToSave.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(factToSave),
    });

    setSaving((prev) => ({ ...prev, [index]: false }));
    fetchFacts();
  };

  const deleteFact = async (index: number) => {
    const fact = draftFacts[index];

    await fetch(`http://localhost:5000/facts/${fact.id}`, {
      method: "DELETE",
    });

    fetchFacts();
  };

  useEffect(() => { 
    fetchFacts(); 
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h3 className="text-xl font-bold mb-3">Facts</h3>

      {/* Add new fact */}
      <div className="flex flex-col gap-2 mb-6">
        <textarea
          className="border border-slate-300 rounded-md p-2 text-sm w-full"
          value={newFact.text}
          onChange={(e) => setNewFact((prev) => ({ ...prev, text: e.target.value }))}
          placeholder="New fact..."
        />

        <select
          className="border border-slate-300 rounded-md p-2 text-sm w-full"
          value={newFact.category}
          onChange={(e) => setNewFact((prev) => ({ ...prev, category: e.target.value }))}
        >
          <option value="character">character</option>
          <option value="worldbuilding">worldbuilding</option>
          <option value="plot">plot</option>
        </select>

        <button
          onClick={addFact}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg mt-1"
        >
          Add Fact
        </button>
      </div>

      {/* Facts list */}
      <ul className="flex flex-col gap-4">
        {draftFacts.map((fact, i) => (
          <li
            key={fact.id}
            className="border-b border-slate-200 pb-4 flex flex-col gap-2"
          >
            <textarea
              className="border border-slate-300 rounded-md p-2 text-sm w-full"
              value={fact.text}
              onChange={(e) => editFact(i, "text", e.target.value)}
            />

            <div className="flex items-center gap-2">
              <select
                className="border border-slate-300 rounded-md p-2 text-sm"
                value={fact.category}
                onChange={(e) => editFact(i, "category", e.target.value)}
              >
                <option value="character">character</option>
                <option value="worldbuilding">worldbuilding</option>
                <option value="plot">plot</option>
              </select>

              {saving[i] && (
                <span className="text-gray-500 text-sm ml-2">Saving…</span>
              )}

              <button
                onClick={() => saveFact(i)}
                className="px-3 py-1 bg-green-500 text-white rounded-md"
              >
                Save
              </button>

              <button
                onClick={() => deleteFact(i)}
                className="px-3 py-1 bg-red-500 text-white rounded-md ml-auto"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FactsTable;
