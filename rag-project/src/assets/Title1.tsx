import { BoxProps } from "../utils/Types"

export default function Title1({children}: BoxProps) {
    return (
        <h1 className="text-2xl font-semibold mb-3 p-1 text-zinc-200">{children}</h1>
    )
}