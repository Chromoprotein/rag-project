import { BoxProps } from "../utils/Types";

export default function LightOuterBox({children}: BoxProps) {
    return (
        <div className="rounded-xl p-2 bg-zinc-700 inset-ring inset-ring-zinc-600 max-h-[50vh]">
            {children}
        </div>
    );
}