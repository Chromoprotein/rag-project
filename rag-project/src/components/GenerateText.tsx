import { useState, useRef } from "react";
import '../styles/output.css';
import MessageBubble from "../assets/MessageBubble.tsx";
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { ChatMessage } from "../utils/Types.tsx";
import ReactMarkdown from "react-markdown";
import Ellipsis from "../assets/Ellipsis.tsx";
import Button from "../assets/Button.tsx";
import SubmitButton from "../assets/SubmitButton.tsx";
import Textarea from "../assets/Textarea.tsx";
import LightBox from "../assets/LightBox.tsx";
import DarkBox from "../assets/DarkBox.tsx";
import LightOuterBox from "../assets/LightOuterBox.tsx";
import FormWrapper from "../assets/FormWrapper.tsx";
import Title1 from "../assets/Title1.tsx";
import Title2 from "../assets/Title2.tsx";

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
      <div className="max-w-3xl mx-auto h-full relative w-full relative">

      {/* SCROLL CONTAINER */}
      <div className="relative flex flex-col h-full">

        {/* Messages */}
        <div className="px-4 py-8 text-zinc-200 flex flex-col gap-3">

          {messages.length === 0 && 
            <div className="flex justify-center pt-4">
              <Title1>What are we writing today?</Title1>
            </div>
          }

          {messages.map((msg: ChatMessage, idx: number) => (
            <MessageBubble key={idx} msg={msg} />
          ))}

          {loading && streamingText && (
            <MessageBubble key="streaming" msg={{role: "assistant", content: streamingText}} />
          )}
        
          {(!collapseQueries || !collapseContext) &&
            <DarkBox>
              {!collapseQueries &&
                <div>
                  <Title2>Generated Queries</Title2>
                  <ul>{queries.map((q, i) => <li key={i}>{q}</li>)}</ul>
                </div>
              }

              {(!collapseQueries && !collapseContext) && <br />}

              {!collapseContext &&
                <div>
                  <Title2>Retrieved Context</Title2>
                  <ReactMarkdown>
                    {(loading && streamingContext) ? streamingContext : context}
                  </ReactMarkdown>
                </div>
              }
            </DarkBox> 
          }

          {(loading && !streamingText) && <Ellipsis />}

        </div>

        {/* Floating input */}
        <div className="sticky bottom-4 z-10 px-4">
          <LightOuterBox>
            <FormWrapper func={handleSubmit}>
              <Textarea val={prompt} func={(e) => setPrompt(e.target.value)} plac="Enter your prompt..." />

              <LightBox>
                <div className="flex flex-row">
                  <Button func={() => setCollapseContext(prev => !prev)}>{collapseContext ? "Show context" : "Hide context"}</Button>
                  <Button func={() => setCollapseQueries(prev => !prev)}>{collapseQueries ? "Show queries" : "Hide queries"}</Button>
                  <SubmitButton isDisabled={loading}>{loading ? "Generating..." : "Send"}</SubmitButton>
                </div>
              </LightBox>
            </FormWrapper>

          </LightOuterBox>
        </div>

      </div>

      </div>
  );
}

export default GenerateText;