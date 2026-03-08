import React from "react";
import { FiPlusSquare } from "react-icons/fi";
import { FaTimes } from "react-icons/fa";
import { TbShare2 } from "react-icons/tb";
import { Container, ContainerX, SecondaryContainerX, PText } from "./styled";
import { Button } from "../Button";

export default function AddToMobileChromeIos(props) {
    const { closePrompt, doNotShowAgain } = props;

    return (
        <Container>
            <FaTimes
                style={{ padding: ".3rem", fontSize: "1.5rem" }}
                onClick={closePrompt}
            />
            <PText>
                For the best experience, we recommend installing the Wapupay app
                to your home screen!
            </PText>
            <ContainerX>
                <PText>Click the</PText>
                <TbShare2 style={{ fontSize: "1.5rem" }} />
                <PText>icon</PText>
            </ContainerX>
            <SecondaryContainerX>
                <PText style={{ marginBottom: "1rem" }}>
                    Scroll down and then click:
                </PText>
                <ContainerX>
                    <PText>Add to Home Screen</PText>
                    <FiPlusSquare style={{ fontSize: "1.5rem" }} />
                </ContainerX>
            </SecondaryContainerX>
            <Button
                secondary={true}
                onClick={doNotShowAgain}
                text={`Don't show again`}
            />
        </Container>
    );
}
