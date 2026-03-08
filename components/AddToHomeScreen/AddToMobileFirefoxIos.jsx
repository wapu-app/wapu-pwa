import React from "react";
import { Container, ContainerX, SecondaryContainerX, PText } from "./styled";
import { Button } from "../Button";
import { AiOutlinePlusSquare } from "react-icons/ai";
import { FaTimes, FaBars } from "react-icons/fa";
import { FiShare } from "react-icons/fi";
export default function AddToMobileFirefoxIos(props) {
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
                <FaBars style={{ fontSize: "1.5rem" }} />
                <PText>icon</PText>
            </ContainerX>
            <SecondaryContainerX>
                <PText style={{ marginBottom: "1rem" }}>
                    Scroll down and then click:
                </PText>
                <ContainerX>
                    <PText>Share</PText>
                    <FiShare style={{ fontSize: "1.5rem" }} />
                </ContainerX>
            </SecondaryContainerX>
            <SecondaryContainerX>
                <PText style={{ marginBottom: "1rem" }}>Then click:</PText>
                <ContainerX>
                    <PText>Add to Home Screen</PText>
                    <AiOutlinePlusSquare style={{ fontSize: "1.5rem" }} />
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
