import { useState, useEffect } from "react";

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
    category: "character",
  });

  const [saving, setSaving] = useState<Record<string, boolean>>({});

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

    setNewFact({ id: "", text: "", category: "character" });
    fetchFacts();
  };

  // Edit a fact by ID
  const editFact = (id: string, field: "text" | "category", value: string) => {
    setDraftFacts((prev) =>
      prev.map((fact) =>
        fact.id === id ? { ...fact, [field]: value } : fact
      )
    );
  };

  // Save a fact by ID
  const saveFact = async (id: string) => {
    setSaving((prev) => ({ ...prev, [id]: true }));

    const fact = draftFacts.find((f) => f.id === id);
    if (!fact) return;

    await fetch(`http://localhost:5000/facts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fact),
    });

    setSaving((prev) => ({ ...prev, [id]: false }));
    fetchFacts();
  };

  // Delete a fact by ID
  const deleteFact = async (id: string) => {
    await fetch(`http://localhost:5000/facts/${id}`, {
      method: "DELETE",
    });

    fetchFacts();
  };

  // Group facts by category (non-destructive)
  const groupedFacts = draftFacts.reduce<Record<string, Fact[]>>((acc, fact) => {
    if (!acc[fact.category]) acc[fact.category] = [];
    acc[fact.category].push(fact);
    return acc;
  }, {});

  // Sort categories alphabetically (optional)
  const categoryOrder = Object.keys(groupedFacts).sort();

  // Sort facts inside each category (optional)
  categoryOrder.forEach((cat) => {
    groupedFacts[cat].sort((a, b) => a.text.localeCompare(b.text));
  });

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
          onChange={(e) =>
            setNewFact((prev) => ({ ...prev, text: e.target.value }))
          }
          placeholder="New fact..."
        />

        <select
          className="border border-slate-300 rounded-md p-2 text-sm w-full"
          value={newFact.category}
          onChange={(e) =>
            setNewFact((prev) => ({ ...prev, category: e.target.value }))
          }
        >
          <option value="character">character</option>
          <option value="worldbuilding">worldbuilding</option>
          <option value="plot">plot</option>
        </select>

        <button
          onClick={addFact}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg mt-1 cursor-pointer"
        >
          Add Fact
        </button>
      </div>

      {/* Facts list */}
      <ul className="flex flex-col gap-8">
        {categoryOrder.map((category) => (
          <li key={category}>
            <h4 className="text-lg font-semibold mb-3 capitalize text-slate-700">
              {category}
            </h4>

            <ul className="flex flex-col gap-4">
              {groupedFacts[category].map((fact) => (
                <li
                  key={fact.id}
                  className="border-b border-slate-200 pb-4 flex flex-col gap-2"
                >
                  <textarea
                    className="border border-slate-300 rounded-md p-2 text-sm w-full"
                    value={fact.text}
                    onChange={(e) => editFact(fact.id, "text", e.target.value)}
                  />

                  <div className="flex items-center gap-2">
                    <select
                      className="border border-slate-300 rounded-md p-2 text-sm"
                      value={fact.category}
                      onChange={(e) =>
                        editFact(fact.id, "category", e.target.value)
                      }
                    >
                      <option value="character">character</option>
                      <option value="worldbuilding">worldbuilding</option>
                      <option value="plot">plot</option>
                    </select>

                    {saving[fact.id] && (
                      <span className="text-gray-500 text-sm ml-2">Saving…</span>
                    )}

                    <button
                      onClick={() => saveFact(fact.id)}
                      className="px-3 py-1 bg-green-500 text-white rounded-md cursor-pointer"
                    >
                      Save
                    </button>

                    <button
                      onClick={() => deleteFact(fact.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded-md ml-auto cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FactsTable;