import { ButtonProps } from "../utils/Types";

export default function SubmitButton({children, isDisabled}: ButtonProps) {
    return (
        <button type="submit" className="m-2 px-4 py-2 bg-blue-600 text-zinc-200 rounded-xl ml-auto">
            {children}
        </button>
    )
}