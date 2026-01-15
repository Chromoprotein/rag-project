from flask import Flask, request, jsonify, Response, send_from_directory
from flask_cors import CORS
from ragPipeline import generate_queries_and_context_stream, stream_generated_text
from fact_utils import load_facts, save_facts
import json
import os
import csv
import uuid

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

# --- Helper functions ---

# Helper function to read the file
def read_style():
    if not os.path.exists(STYLE_FILE):
        # Return default if file doesn't exist
        return {
            "pov": "First person",
            "tense": "Past tense",
            "style": ""
        }
    with open(STYLE_FILE, "r") as f:
        return json.load(f)

# Helper function to write to the file
def write_style(style_data):
    with open(STYLE_FILE, "w") as f:
        json.dump(style_data, f, indent=4)

# --- Writing generator ---

@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    messages = data.get("messages", [])
    latest_user_message = messages[-1]["content"] if messages else ""
    old_context = data.get("old_context", "")

    writing_style = read_style() # get the writing style instructions

    def event_stream():

        full_context = ""  # accumulate context for generation

        # --- STREAM QUERIES & CONTEXT ---
        for event_type, payload in generate_queries_and_context_stream(latest_user_message, old_context):
            if event_type == "queries":
                yield f"event: queries\ndata: {json.dumps(payload)}\n\n"
            elif event_type == "context":
                full_context += payload + "\n\n"
                yield f"event: context\ndata: {json.dumps(payload)}\n\n"

        # --- If no new context was retrieved, fall back to old_context ---
        if not full_context.strip():
            full_context = old_context

        # --- STREAM GENERATED TEXT ---
        buffer = ""
        for chunk in stream_generated_text(messages, full_context, writing_style):
            buffer += chunk
            
            # Send buffer when we hit newlines or buffer gets large enough
            if "\n" in buffer or len(buffer) > 50:
                safe_chunk = buffer.replace("\0", "")
                # Escape newlines in JSON to preserve them
                yield f"event: text\ndata: {json.dumps(safe_chunk)}\n\n"
                buffer = ""
        
        # Send any remaining buffer
        if buffer:
            safe_chunk = buffer.replace("\0", "")
            yield f"event: text\ndata: {json.dumps(safe_chunk)}\n\n"

        yield "event: end\ndata: \n\n"

    return Response(event_stream(), mimetype="text/event-stream")

# --- CRUD Endpoints ---

@app.route("/facts", methods=["GET"])
def get_facts():
    facts = load_facts()
    return jsonify(facts)

@app.route("/facts", methods=["POST"])
def add_fact():
    data = request.json
    text = data.get("text", "").strip()
    category = data.get("category", "uncategorized").strip()

    if not text:
        return jsonify({"error": "Text cannot be empty"}), 400

    facts = load_facts()

    new_fact = {
        "id": str(uuid.uuid4()),
        "category": category,
        "text": text,
    }

    facts.append(new_fact)
    save_facts(facts)

    return jsonify(new_fact)

@app.route("/facts/<fact_id>", methods=["PUT"])
def edit_fact(fact_id):
    data = request.json

    facts = load_facts()

    # Find the item with this ID
    for fact in facts:
        if fact["id"] == fact_id:
            # Update fields if present
            if "text" in data:
                fact["text"] = data["text"].strip()
            if "category" in data:
                fact["category"] = data["category"].strip()

            save_facts(facts)
            return jsonify({"status": "ok", "item": fact})

    return jsonify({"error": "Fact not found"}), 404

@app.route("/facts/<fact_id>", methods=["DELETE"])
def delete_fact(fact_id):
    facts = load_facts()

    new_facts = [f for f in facts if f["id"] != fact_id]

    if len(new_facts) == len(facts):
        return jsonify({"error": "Fact not found"}), 404

    save_facts(new_facts)

    return jsonify({"status": "ok"})

# --- Writing style endpoints ---

STYLE_FILE = "writing_style.json"

# Route to GET the current writing style
@app.route("/getStyle", methods=["GET"])
def get_style():
    style = read_style()
    return jsonify(style)

# Route to POST and save the writing style
@app.route("/postStyle", methods=["POST"])
def post_style():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    # Optional: validate keys
    expected_keys = {"pov", "tense", "style"}
    if not expected_keys.issubset(data.keys()):
        return jsonify({"error": "Missing keys in data"}), 400

    write_style(data)
    return jsonify({"message": "Style saved successfully!"})

# --- Serve React frontend (catch-all) ---
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    build_dir = os.path.join(os.path.dirname(__file__), "build")
    if path != "" and os.path.exists(os.path.join(build_dir, path)):
        return send_from_directory(build_dir, path)
    else:
        return send_from_directory(build_dir, "index.html")

if __name__ == "__main__":
    app.run(debug=True)
