import { FormProps } from "../utils/Types";

export default function FormWrapper({children, func}: FormProps) {
    return (
        <form onSubmit={func} className="flex flex-col p-1 gap-1 flex flex-col">
            {children}
        </form>
    );
}