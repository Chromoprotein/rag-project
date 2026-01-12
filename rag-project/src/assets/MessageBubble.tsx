import ReactMarkdown from "react-markdown";
import { ChatMessage } from "../utils/Types.tsx";

interface BubbleProps {
    key: number | string;
    msg: ChatMessage;
}

export default function MessageBubble({key, msg}: BubbleProps) {
    return (
        <div key={key} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div  className={`${msg.role === "user" ? "max-w-[75%] bg-blue-500 border-blue-400" : "w-[75%] bg-zinc-800 border-zinc-600"} p-4 rounded-lg border-1 text-zinc-200`}>
            <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
        </div>
    );
}