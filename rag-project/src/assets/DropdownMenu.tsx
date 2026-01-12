import { DropdownProps } from "../utils/Types"

export default function DropdownMenu({val, func, options}: DropdownProps) {
    return (
        <select
          className="border text-zinc-900 border-zinc-500 rounded-md text-sm m-2 px-4 py-2"
          value={val}
          onChange={func}
        >
            {options.map(o => <option value={o}>{o}</option>)}
        </select>
    );
}