import { BoxProps } from "../utils/Types";

export default function PageSizeWrapper({children}: BoxProps) {
    return (
        <div className="max-w-3xl mx-auto w-full h-full pb-4 relative">
            {children}
        </div>
    );
}