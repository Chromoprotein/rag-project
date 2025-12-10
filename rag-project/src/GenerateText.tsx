import { useState, useRef } from "react";
import './output.css';
import ReactMarkdown from "react-markdown";
import { fetchEventSource } from '@microsoft/fetch-event-source';

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function GenerateText() {
  const [prompt, setPrompt] = useState(""); // New prompt
  const [messages, setMessages] = useState<ChatMessage[]>([]); // Chat history

  const [collapseQueries, setCollapseQueries] = useState(false);
  const [collapseContext, setCollapseContext] = useState(false);
  const [loading, setLoading] = useState(false);

  const [queries, setQueries] = useState<string[]>([]); // Queries for facts database
  const [context, setContext] = useState(""); // Context retrieved from database

  const [streamingText, setStreamingText] = useState("");
  const textRef = useRef("");

  const [streamingContext, setStreamingContext] = useState("");
  const contextRef = useRef("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add the user's new prompt to chat history
    const userMessage: ChatMessage = { role: "user", content: prompt };
    setMessages(prev => [...prev, userMessage]);

    setStreamingText("");
    textRef.current = "";

    setPrompt("");
    setLoading(true);
    
    contextRef.current = "";
    const oldContextSnapshot = context; // fallback context

    try {

      await fetchEventSource("http://localhost:5000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],   // send full chat
          old_context: oldContextSnapshot
        }),

        // Incoming SSE event handler
        onmessage: (event) => {
          if (event.event === "queries") {
            const qs = JSON.parse(event.data);
            if (Array.isArray(qs) && qs.length > 0) {
              setQueries(qs);
            }
          }

          if (event.event === "context") {
            const passage = JSON.parse(event.data);
            contextRef.current += passage + "\n\n";
            setStreamingContext(contextRef.current);
          }

          if (event.event === "text") {
            const chunk = JSON.parse(event.data);
            textRef.current += chunk;
            setStreamingText(textRef.current);
          }

          if (event.event === "end") {
            setLoading(false);

            // commit new context only if any was retrieved
            if (contextRef.current.trim().length > 0) {
              setContext(contextRef.current);
            }

            // store assistant reply in chat history
            setMessages(prev => [
              ...prev,
              { role: "assistant", content: textRef.current }
            ]);
          }
        },

        onerror: (err) => {
          console.error("SSE error:", err);
          setLoading(false);
        },
      });
    } catch (err) {
      console.error("fetchEventSource threw:", err);
      setLoading(false);
    }

  };

  return (
    <div className="p-6 max-w-lg mx-auto flex flex-col min-h-screen">

      <div className="flex-grow p-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.role === "user" ? "text-right" : "text-left"}>
            <strong>{msg.role === "user" ? "You:" : "Assistant:"}</strong>
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        ))}

        {loading && streamingText && (
          <div className="text-left">
            <strong>Assistant:</strong>
            <ReactMarkdown>{streamingText}</ReactMarkdown>
          </div>
        )}
      </div>
      
      <div className="sticky mt-top bg-gray-200 p-4 bottom-0 max-h-[50vh] overflow-y-auto">
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
            className="m-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            {loading ? "Generating..." : "Send"}
          </button>
          
          <button type="button" className="m-2 px-4 py-2 bg-blue-600 text-white rounded-lg" onClick={() => setCollapseContext(prev => !prev)}>
            {collapseContext ? "Show context" : "Hide context"}
          </button>
          <button type="button" className="m-2 px-4 py-2 bg-blue-600 text-white rounded-lg" onClick={() => setCollapseQueries(prev => !prev)}>
            {collapseQueries ? "Show queries" : "Hide queries"}
          </button>
        </form>

        {!collapseQueries &&
          <div className="mt-4">
            <h3>Generated Queries:</h3>
            <ul>{queries.map((q, i) => <li key={i}>{q}</li>)}</ul>
          </div>
        }

        {!collapseContext &&
          <div className="mt-4">
            <h3>Retrieved Context:</h3>
            <ReactMarkdown>{(loading && streamingContext) ? streamingContext : context}</ReactMarkdown>
          </div>
        }

      </div>

    </div>
  );
}

export default GenerateText;