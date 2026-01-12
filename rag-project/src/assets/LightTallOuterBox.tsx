import { BoxProps } from "../utils/Types";

export default function LightTallOuterBox({children}: BoxProps) {
    return (
        <div className="rounded-xl bg-zinc-700 inset-ring inset-ring-zinc-600">
            {children}
        </div>
    );
}