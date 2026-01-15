import React, { useState, useEffect } from "react";
import { Style } from "../utils/Types.tsx";
import LightOuterBox from "../assets/LightOuterBox.tsx";
import Textarea from "../assets/Textarea.tsx";
import FormWrapper from "../assets/FormWrapper.tsx";
import Title1 from "../assets/Title1.tsx";
import SubmitButton from "../assets/SubmitButton.tsx";
import LightBox from "../assets/LightBox.tsx";
import DropdownMenu from "../assets/DropdownMenu.tsx";
import PageSizeWrapper from "../assets/PageSizeWrapper.tsx";

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
        <PageSizeWrapper>

            <div className="flex flex-col gap-5">

                <LightOuterBox>
                    <FormWrapper func={handleSubmit}>
                        <Title1>Writing Style</Title1>
                        <Textarea val={writingStyle.style} func={(e) => setWritingStyle((prev) => ({ ...prev, style: e.target.value }))} plac="Describe your writing style" />

                        <LightBox>
                            <div className="flex flex-row">
                                {selectOptions.map(({ name, value, options }, index) => {
                                    return <DropdownMenu 
                                        key={index}
                                        val={value} 
                                        func={(e) =>
                                            setWritingStyle((prev) => ({ ...prev, [name]: e.target.value }))} 
                                        options={options} 
                                    />
                                })}
                                <SubmitButton isDisabled={loading}>{loading ? "Saving..." : "Save"}</SubmitButton>
                            </div>
                        </LightBox>

                    </FormWrapper>
                </LightOuterBox>

            </div>
        </PageSizeWrapper>
    );
}