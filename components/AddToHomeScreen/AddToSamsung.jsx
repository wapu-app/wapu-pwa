import React from "react";
import { Container, ContainerX, SecondaryContainerX, PText } from "./styled";
import { Button } from "../Button";
import { FaTimes, FaBars } from "react-icons/fa";
import { TfiPlus } from "react-icons/tfi";
export default function AddToSamsung(props) {
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
                <PText>Scroll down and then click:</PText>
                <ContainerX>
                    <TfiPlus style={{ fontSize: "1.5rem" }} />
                    <PText>Add page to</PText>
                </ContainerX>
            </SecondaryContainerX>
            <ContainerX>
                <PText>Then select:</PText>
                <SecondaryContainerX>
                    <PText>Home screen</PText>
                </SecondaryContainerX>
            </ContainerX>
            <Button
                secondary={true}
                onClick={doNotShowAgain}
                text={`Don't show again`}
            />
        </Container>
    );
}
