import { useState } from "react";
import './output.css';
import ReactMarkdown from "react-markdown";

function App() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [queries, setQueries] = useState<string[]>([]);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult("");
    setQueries([]);
    setContext("");

    try {
      const res = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setResult(data.result);
      setQueries(data.queries);
      setContext(data.context);
    } catch (err) {
      setResult("Error: could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          className="w-full p-2 border rounded-lg"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>

    {queries.length > 0 && (
      <div className="mt-4">
        <h3 className="font-semibold">Generated Queries:</h3>
        <ul className="list-disc ml-6">
          {queries.map((q, i) => <li key={i}>{q}</li>)}
        </ul>
      </div>
    )}

    {context && (
      <div className="mt-4">
        <h3 className="font-semibold">Retrieved Context:</h3>
        <pre className="whitespace-pre-wrap bg-gray-100 p-3 rounded">{context}</pre>
      </div>
    )}

    {result && (
      <div className="mt-6">
        <h3 className="font-semibold">Generated Writing:</h3>
        <div className="mt-2 bg-gray-50 p-4 rounded-lg">
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      </div>
    )}

    </div>
  );
}

export default App;
