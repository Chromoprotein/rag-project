import csv
import os

CSV_PATH = os.path.join(os.path.dirname(__file__), "ragdata.csv")

def load_facts():
    """Load facts as a list of {category, text} dicts."""
    facts = []
    if os.path.exists(CSV_PATH):
        with open(CSV_PATH, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                facts.append({
                    "category": (row.get("category") or "").strip(),
                    "text": (row.get("text") or "").strip(),
                })
    return facts

def save_facts(facts):
    """Save a list of {category, text} dicts back to CSV."""
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        fieldnames = ["category", "text"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for fact in facts:
            writer.writerow({
                "category": fact.get("category", ""),
                "text": fact.get("text", ""),
            })
