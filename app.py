from flask import Flask, request, Response
from flask_cors import CORS
from ragPipeline import generate_queries_and_context_stream, stream_generated_text
import json

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

if __name__ == "__main__":
    app.run(debug=True)
