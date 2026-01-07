import ReactMarkdown from "react-markdown";
import { ChatMessage } from "./Types.tsx";

interface BubbleProps {
    key: number | string;
    msg: ChatMessage;
}

export default function MessageBubble({key, msg}: BubbleProps) {
    return (
        <div key={key} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div  className={`${msg.role === "user" ? "bg-blue-500 border-blue-400" : "bg-zinc-800 border-zinc-600"} max-w-[75%] p-4 rounded-lg border-1 text-zinc-200`}>
            <div className={`${msg.role === "user" ? "text-right" : "text-left"}`}>
                <strong>{msg.role === "user" ? "You:" : "Assistant:"}</strong>
            </div>
            <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
        </div>
    );
}