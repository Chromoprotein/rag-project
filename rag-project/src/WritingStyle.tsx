import React, { useState, useEffect } from "react";

type Style = {
    pov: string,
    tense: string,
    style: string,
};

export default function WritingStyle() {

    const [loading, setLoading] = useState(false);
    const initialStyle: Style = {
        pov: "first person",
        tense: "past tense",
        style: "",
    }
    const [writingStyle, setWritingStyle] = useState<Style>(initialStyle);

    const fetchStyle = async () => {
        const res = await fetch("http://localhost:5000/getStyle");
        const data = await res.json();
        setWritingStyle(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        await fetch(`http://localhost:5000/postStyle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(writingStyle),
        });

        setLoading(false);
        fetchStyle();
    }

    const selectOptions = [
        { name: "pov", value: writingStyle.pov, options: ["Third person limited", "First person", "Third person omniscient", "Second person"] },
        { name: "tense", value: writingStyle.tense, options: ["Past tense", "Present tense"] }
    ]

    useEffect(() => {
        fetchStyle();
    }, []);

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-3">Writing Style Settings</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                
                {selectOptions.map(({ name, value, options }, index) => {
                    return <select
                        key={index}
                        value={value}
                        className="border border-slate-300 rounded-md p-2 text-sm"
                        name={name}
                        onChange={(e) =>
                            setWritingStyle((prev) => ({ ...prev, [name]: e.target.value }))
                        }
                    >
                        {options.map((o, i) => <option key={i} value={o}>{o}</option>)}
                    </select>
                })}

                <textarea
                    value={writingStyle.style}
                    onChange={(e) => setWritingStyle((prev) => ({ ...prev, style: e.target.value }))}
                    placeholder="Describe your writing style..."
                    className="w-full p-2 border rounded-lg"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="m-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                    {loading ? "Saving..." : "Save"}
                </button>
            </form>
        </div>
    );
}