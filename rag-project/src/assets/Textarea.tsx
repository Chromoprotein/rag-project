import { TextareaProps } from "../utils/Types"

export default function Textarea({val, func, plac}: TextareaProps) {
    return (
        <textarea
        value={val}
        onChange={func}
        placeholder={plac}
        className="w-full min-h-24 p-4 resize-none rounded-lg bg-zinc-800 border-1 border-zinc-600 focus:outline-hidden placeholder:text-zinc-400 text-zinc-200"
        />
    )
}