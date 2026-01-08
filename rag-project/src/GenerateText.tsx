import { useState, useRef } from "react";
import './output.css';
import MessageBubble from "./MessageBubble.tsx";
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { ChatMessage } from "./Types.tsx";
import ReactMarkdown from "react-markdown";
import Ellipsis from "./Ellipsis.tsx";

function GenerateText() {
  const [prompt, setPrompt] = useState(""); // New prompt
  const [messages, setMessages] = useState<ChatMessage[]>([]); // Chat history

  const [collapseQueries, setCollapseQueries] = useState(true);
  const [collapseContext, setCollapseContext] = useState(true);
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
      <div className="max-w-3xl mx-auto h-full relative w-full">

      {/* SCROLL CONTAINER */}
      <div className="relative flex flex-col h-full">

        {/* Messages */}
        <div className="px-4 py-8 text-zinc-200 flex flex-col gap-3">

          {messages.length === 0 && 
            <div className="flex justify-center pt-4">
              <h1 className="text-2xl">What are we writing today?</h1>
            </div>
          }

          {messages.map((msg: ChatMessage, idx: number) => (
            <MessageBubble key={idx} msg={msg} />
          ))}

          {loading && streamingText && (
            <MessageBubble key="streaming" msg={{role: "assistant", content: streamingText}} />
          )}

          {(loading && !streamingText) && <Ellipsis />}

        </div>
        
        {/* Floating input */}
        <div className="sticky bottom-4 z-10 px-4">
          <div className="rounded-xl bg-zinc-700 inset-ring inset-ring-zinc-600 max-h-[50vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="flex flex-col p-1 gap-1 flex flex-col">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt..."
                className="w-full min-h-24 p-4 resize-none rounded-lg bg-zinc-800 border-1 border-zinc-600 focus:outline-hidden placeholder:text-zinc-400 text-zinc-200"
              />

              <div className="bg-zinc-600 rounded-lg border-zinc-500 border-1 outline-2 outline-zinc-800 flex flex-row">
                <button type="button" className="m-2 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400" onClick={() => setCollapseContext(prev => !prev)}>
                  {collapseContext ? "Show context" : "Hide context"}
                </button>
                <button type="button" className="m-2 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400" onClick={() => setCollapseQueries(prev => !prev)}>
                  {collapseQueries ? "Show queries" : "Hide queries"}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="m-2 px-4 py-2 bg-blue-600 text-zinc-200 rounded-xl ml-auto"
                >
                  {loading ? "Generating..." : "Send"}
                </button>
              </div>

              {(!collapseQueries || !collapseContext) &&
                <div className="p-4 rounded-lg bg-zinc-800 border-1 border-zinc-600 text-zinc-200">
                  {!collapseQueries &&
                    <div>
                      <h3>Generated Queries:</h3>
                      <ul>{queries.map((q, i) => <li key={i}>{q}</li>)}</ul>
                    </div>
                  }

                  {(!collapseQueries && !collapseContext) && <br />}

                  {!collapseContext &&
                    <div>
                      <h3>Retrieved Context:</h3>
                      <ReactMarkdown>{(loading && streamingContext) ? streamingContext : context}</ReactMarkdown>
                    </div>
                  }
                </div> 
              }

            </form>

          </div>
        </div>

      </div>

      </div>
  );
}

export default GenerateText;