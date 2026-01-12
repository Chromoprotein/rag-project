import { BoxProps } from "../utils/Types"

export default function DarkBox({children}: BoxProps) {
    return (
        <div className="p-2 rounded-lg bg-zinc-800 border-1 border-zinc-600 text-zinc-200">
            {children}
        </div>
    )
}