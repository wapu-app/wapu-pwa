import React from "react";
import Link from "next/link";
import { Container, SecondaryContainerX, PText } from "./styled";
import { Button } from "../Button";
import { FaTimes } from "react-icons/fa";
export default function AddToOtherBrowser(props) {
    const { closePrompt, doNotShowAgain } = props;
    const searchUrl = `https://www.google.com/search?q=add+to+home+screen+for+common-mobile-browsers`;

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
            <SecondaryContainerX>
                <PText>
                    Unfortunately, we were unable to determine which browser you
                    are using. Please search for how to install a web app for
                    your browser.
                </PText>
                <Link
                    style={{
                        display: "flex",
                        width: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        textDecoration: "none",
                        color: "white",
                        border: "1px solid pink",
                        padding: "12px 0",
                        borderRadius: ".5rem",
                        marginTop: "1rem",
                    }}
                    href={searchUrl}
                    target="_blank"
                >
                    Try This Search
                </Link>
            </SecondaryContainerX>
            <Button
                secondary={true}
                onClick={doNotShowAgain}
                text={`Don't show again`}
            />
        </Container>
    );
}
