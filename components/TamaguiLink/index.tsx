import React from "react";
import { styled, Button } from "tamagui";
const LinkCustom = styled(Button, {
    color: "$pink500",
    fontSize: "$4",
    fontWeight: "$2",
    width: "fit-content",
});
export default function TamaguiLink({ text, onClick , style}) {
    return (
        <LinkCustom 
            chromeless 
            onPress={onClick}
            style={style}
        >
            {text}
        </LinkCustom>
    );
}
