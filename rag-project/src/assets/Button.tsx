import { ButtonProps } from "../Types"

export default function Button({func, children}: ButtonProps) {
    return (
        <button type="button" className="m-2 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400" onClick={func}>
            {children}
        </button>
    )
}