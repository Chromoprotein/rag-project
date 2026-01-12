import { BoxProps } from "../utils/Types"

export default function Title2({children}: BoxProps) {
    return (
        <h2 className="text-lg font-semibold mb-3 capitalize p-1 text-zinc-200">{children}</h2>
    )
}