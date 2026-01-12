import { BoxProps } from "../utils/Types"

export default function LightBox({children}: BoxProps) {
    return (
        <div className="bg-zinc-600 rounded-lg border-zinc-500 border-1 outline-2 outline-zinc-800">
            {children}
        </div>
    )
}