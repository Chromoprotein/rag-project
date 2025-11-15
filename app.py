from flask import Flask, request, jsonify, Response, send_from_directory
from flask_cors import CORS
from ragPipeline import generate_queries_and_context_stream, stream_generated_text
from fact_utils import load_facts, save_facts
import json
import os
import csv

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

@app.route("/generate", methods=["GET"])
def generate():
    user_prompt = request.args.get("prompt", "")

    def event_stream():

        full_context = ""  # accumulate context for generation

        # --- STREAM QUERIES & CONTEXT ---
        for event_type, payload in generate_queries_and_context_stream(user_prompt):
            if event_type == "queries":
                yield f"event: queries\ndata: {json.dumps(payload)}\n\n"
            elif event_type == "context":
                full_context += payload + "\n\n"
                yield f"event: context\ndata: {json.dumps(payload)}\n\n"

        # --- STREAM GENERATED TEXT ---
        buffer = ""
        for chunk in stream_generated_text(user_prompt, full_context):
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

    passages = load_facts()
    passages.append({"category": category, "text": text})
    save_facts(passages)

    return jsonify({"status": "ok", "category": category, "text": text})

@app.route("/facts/<int:index>", methods=["PUT"])
def edit_fact(index):
    data = request.json
    text = data.get("text", "").strip()
    category = data.get("category", None)

    passages = load_facts()
    if index < 0 or index >= len(passages):
        return jsonify({"error": "Index out of range"}), 404

    if "text" in data:
        passages[index]["text"] = text

    if "category" in data:
        passages[index]["category"] = category

    save_facts(passages)

    return jsonify({"status": "ok", "item": passages[index]})

@app.route("/facts/<int:index>", methods=["DELETE"])
def delete_fact(index):
    facts = load_facts()

    if index < 0 or index >= len(facts):
        return jsonify({"error": "Index out of range"}), 404

    removed = facts.pop(index)
    save_facts(facts)

    return jsonify({"status": "ok", "removed": removed})

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
