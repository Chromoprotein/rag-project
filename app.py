from flask import Flask, request, Response
from flask_cors import CORS
from ragPipeline import generate_queries_and_context, stream_generated_text
import json

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

@app.route("/generate", methods=["GET"])
def generate():
    user_prompt = request.args.get("prompt", "")
    queries, context = generate_queries_and_context(user_prompt)

    def event_stream():
        # Send metadata once
        metadata = {"queries": queries, "context": context}
        yield f"event: metadata\ndata: {json.dumps(metadata)}\n\n"

        # Buffer chunks to preserve formatting
        buffer = ""
        for chunk in stream_generated_text(user_prompt, context):
            buffer += chunk
            
            # Send buffer when we hit newlines or buffer gets large enough
            if "\n" in buffer or len(buffer) > 50:
                safe_chunk = buffer.replace("\0", "")
                # Escape newlines in JSON to preserve them
                yield f"data: {json.dumps(safe_chunk)}\n\n"
                buffer = ""
        
        # Send any remaining buffer
        if buffer:
            safe_chunk = buffer.replace("\0", "")
            yield f"data: {json.dumps(safe_chunk)}\n\n"

        yield "event: end\ndata: \n\n"

    return Response(event_stream(), mimetype="text/event-stream")

if __name__ == "__main__":
    app.run(debug=True)
