import React from "react";
import Image from "next/image";
import { Container, ContainerX, SecondaryContainerX, PText } from "./styled";
import { Button } from "../Button";
import ffIcon from "../../public/firefox_install.png";
import { FaTimes } from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
export default function AddToMobileFirefox(props) {
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
                <HiDotsVertical style={{ fontSize: "1.5rem" }} />
                <PText>icon</PText>
            </ContainerX>
            <SecondaryContainerX>
                <PText style={{ marginBottom: "1rem" }}>
                    Scroll down and then click:
                </PText>
                <ContainerX>
                    <Image
                        src={ffIcon}
                        alt="Firefox install icon"
                        width={32}
                        height={32}
                    />
                    <PText>Install</PText>
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
