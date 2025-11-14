import { useState, useRef } from "react";
import './output.css';
import ReactMarkdown from "react-markdown";

function App() {
  const [prompt, setPrompt] = useState("");
  const [queries, setQueries] = useState<string[]>([]);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [finalText, setFinalText] = useState("");
  const textRef = useRef("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStreamingText("");
    setFinalText("");
    setQueries([]);
    setContext("");
    setLoading(true);
    textRef.current = "";

    // Start SSE stream
    const evtSource = new EventSource(
      `http://localhost:5000/generate?prompt=${encodeURIComponent(prompt)}`
    );

    // Streamed text chunks
    evtSource.onmessage = (e) => {
      try {
        const chunk = JSON.parse(e.data);
        textRef.current += chunk;
        setStreamingText(textRef.current);
      } catch {
        // Fallback for non-JSON data
        textRef.current += e.data;
        setStreamingText(textRef.current);
      }
    };

    // Metadata: queries and context
    evtSource.addEventListener("metadata", (e: any) => {
      try {
        const data = JSON.parse(e.data);
        setQueries(data.queries);
        setContext(data.context);
      } catch {
        setQueries([]);
        setContext("");
      }
    });

    // Stream end
    evtSource.addEventListener("end", () => {
      evtSource.close();
      setFinalText(textRef.current); 
      console.log("ref:", textRef.current);
      console.log("state:", streamingText);
      setLoading(false);
    });

    // Cleanup if user navigates away
    return () => evtSource.close();
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
          <h3>Generated Queries:</h3>
          <ul>{queries.map((q, i) => <li key={i}>{q}</li>)}</ul>
        </div>
      )}

      {context && (
        <div className="mt-4">
          <h3>Retrieved Context:</h3>
          <pre className="whitespace-pre-wrap">{context}</pre>
        </div>
      )}

      {(streamingText || finalText) && (
        <div className="mt-6">
          <h3>Generated Writing:</h3>
            <ReactMarkdown>{loading ? streamingText : finalText}</ReactMarkdown>
        </div>
      )}

    </div>
  );
}

export default App;
