import { CustomButtonRequest, CustomLink, CustomLoader } from "./styled";
import { useState } from "react";

export const ButtonRequest = ({ text, onClick, type, href, isDisabled }) => {
    const [pressed, setPressed] = useState(false);
    const [requestPending, setRequestPending] = useState(false);

    const handleButtonClick = async (e) => {
        if (!pressed) {
            // Set the button as pressed
            setPressed(true);
            setRequestPending(true);
            try {
                // Execute the onClick function passed as prop
                onClick && (await onClick(e));
            } finally {
                // Reset pressed state and disabled state after action is completed
                setPressed(false);
                setRequestPending(false);
            }
        }
    };

    return (
        <>
            {href ? (
                <CustomButtonRequest
                    disabled={isDisabled ? isDisabled : requestPending}
                    pressed={pressed}
                    type={type}
                    onClick={handleButtonClick}
                    style={{
                        background: isDisabled ? "#ccc" : ""
                    }}
                >
                    <CustomLink href={href}>{text}</CustomLink>
                    {pressed ? <CustomLoader /> : ""}
                </CustomButtonRequest>
            ) : (
                <CustomButtonRequest
                    disabled={isDisabled ? isDisabled : requestPending}
                    pressed={pressed}
                    type={type}
                    onClick={handleButtonClick}
                    style={
                        requestPending || isDisabled
                            ? { background: "#ccc", cursor: "not-allowed" }
                            : {}
                    }
                >
                    {text}
                    {pressed ? <CustomLoader /> : ""}
                </CustomButtonRequest>
            )}
        </>
    );
};
