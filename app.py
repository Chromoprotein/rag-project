# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from ragPipeline import generate_answer  # import your function

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    user_prompt = data.get("prompt", "")
    output = generate_answer(user_prompt)
    return jsonify(output)

if __name__ == "__main__":
    app.run(debug=True)
