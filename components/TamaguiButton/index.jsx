import Link from "next/link";
import React, { useState } from "react";
import { Button, Anchor } from "tamagui";
import { Spinner } from "../CustomSpinner";
export default function TamaguiButton({
    text,
    onClick,
    href,
    secondary,
    terciary,
    isDisabled,
    target,
    middle,
    isLoading
}) {
    const [pressed, setPressed] = useState(false);
    const [disabled, setDisabled] = useState(false);

    const handleButtonClick = async (e) => {
        if (!pressed) {
            // Set the button as pressed
            setPressed(true);
            setDisabled(true);
            try {
                // Execute the onClick function passed as prop
                onClick && (await onClick(e));
            } finally {
                // Reset pressed state and disabled state after action is completed
                setPressed(false);
                setDisabled(false);
            }
        }
    };
    return (
        <>
            {href ? (
                <Anchor
                    href={href}
                    target={target}
                    style={{ textDecoration: "none" }}
                    width={"$width100"}
                >
                    <Button
                        height={middle ? "$9" : "$heightAuto"}
                        width={"$width100"}
                        disabled={isDisabled ? true : disabled}
                        backgroundColor={
                            secondary
                                ? "$transparent"
                                : terciary
                                ? "$transparent"
                                : isDisabled
                                ? "$semanticGray"
                                : `$pink500`
                        }
                        padding={"$3.5"}
                        fontFamily={"$body"}
                        fontSize={middle ? "$4" : "$1"}
                        color={
                            secondary
                                ? "$pink500"
                                : terciary
                                ? "$pink500"
                                : isDisabled
                                ? "$semanticGray"
                                : "$neutral13" /* default */
                        }
                        fontWeight={"$2"}
                        borderColor={
                            secondary
                                ? "$pink500"
                                : pressed
                                ? "$semanticGray"
                                : "transparent" /* default */
                        }
                    >
                        {text}
                    </Button>
                </Anchor>
            ) : (
                <Button
                    disabled={isDisabled ? true : disabled}
                    onPress={handleButtonClick}
                    width={"$width100"}
                    height={middle ? "$9" : "$heightAuto"}
                    padding={"$3.5"}
                    fontFamily={"$body"}
                    fontSize={middle ? "$4" : "$1"}
                    fontWeight={"$2"}
                    color={
                        secondary
                            ? "$pink500"
                            : terciary
                            ? "$pink500"
                            : pressed
                            ? "$semanticGray"
                            : "$neutral13" /* default */
                    }
                    backgroundColor={
                        secondary
                            ? "$transparent"
                            : terciary
                            ? "$transparent"
                            : isDisabled
                            ? "$semanticGray"
                            : pressed || isLoading
                            ? "$pink300"
                            : `$pink500` /* default */
                    }
                    borderColor={
                        secondary
                            ? "$pink500"
                            : /* : terciary
                            ? "transparent" */
                            pressed
                            ? "$semanticGray"
                            : "transparent" /* default */
                    }
                >
                    {isLoading ? <Spinner/> : text}
                </Button>
            )}
        </>
    );
}
