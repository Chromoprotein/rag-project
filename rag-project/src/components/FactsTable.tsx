import { useState, useEffect } from "react";
import Title1 from "../assets/Title1.tsx";
import Title2 from "../assets/Title2.tsx";
import Button from "../assets/Button.tsx";
import SubmitButton from "../assets/SubmitButton.tsx";
import Textarea from "../assets/Textarea.tsx";
import LightBox from "../assets/LightBox.tsx";
import DarkBox from "../assets/DarkBox.tsx";
import LightOuterBox from "../assets/LightOuterBox.tsx";
import FormWrapper from "../assets/FormWrapper.tsx";
import DropdownMenu from "../assets/DropdownMenu.tsx";
import { Fact } from "../utils/Types.tsx";
import Skeleton from "../assets/Skeleton.tsx";

function FactsTable() {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [draftFacts, setDraftFacts] = useState<Fact[]>([]);
  const [newFact, setNewFact] = useState<Fact>({
    id: "",
    text: "",
    category: "character",
  });

  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Boolean>(true);

  // Fetch from backend
  const fetchFacts = async () => {
    try {
      const res = await fetch("http://localhost:5000/facts");
      const data = await res.json();
      setFacts(data);
      setDraftFacts(data);
    } catch (err) {
      console.error(err);
      setLoading(false);
    } finally {
      setLoading(false);
    }
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
    <div className="max-w-3xl mx-auto w-full h-full pb-4">

      <div className="flex flex-col gap-5">

        {/* Add new fact */}
        <LightOuterBox>
          <FormWrapper func={addFact}>
            <Title1>Story Database</Title1>
            <Textarea func={(e) => setNewFact((prev) => ({ ...prev, text: e.target.value }))} val={newFact.text} plac="Enter a new fact" />

            <LightBox>
              <div className="flex flex-row">
                <DropdownMenu 
                  val={newFact.category} 
                  func={(e) => setNewFact((prev) => ({ ...prev, category: e.target.value }))} 
                  options={["character", "worldbuilding", "plot"]} 
                />
                <SubmitButton>Add Fact</SubmitButton>
              </div>
            </LightBox>
          </FormWrapper>
        </LightOuterBox>

        {loading && <Skeleton />}

        {/* Facts list */}
        {categoryOrder.map((category) => (
          <DarkBox key={category}>
            <div className="flex flex-col gap-3 p-1">
              <Title2>{category} Data</Title2>

              {groupedFacts[category].map((fact) => (
                <div className="flex flex-col gap-3">
                <LightBox>
                  <>
                    <FormWrapper func={() => saveFact(fact.id)} key={fact.id}>
                      <Textarea val={fact.text} plac="Enter a fact" func={(e) => editFact(fact.id, "text", e.target.value)}/>

                      <div className="flex flex-row">
                        <DropdownMenu 
                          val={fact.category} 
                          func={(e) => editFact(fact.id, "category", e.target.value)} 
                          options={["character", "worldbuilding", "plot"]} 
                        />

                        {saving[fact.id] && (
                          <span className="text-sm ml-2">Saving…</span>
                        )}

                        <SubmitButton>Save</SubmitButton>
                        <Button func={() => deleteFact(fact.id)}>Delete</Button>
                      </div>
                    </FormWrapper>
                  </>
                </LightBox>
                </div>
              ))}

            </div>
          </DarkBox>
        ))}

      </div>

    </div>
  );
}

export default FactsTable;