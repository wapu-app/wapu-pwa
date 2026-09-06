import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button, Paragraph, YStack } from "tamagui";

import copyIcon from "../../public/copy_icon.svg";

// How long the green "Copied" confirmation stays up after a tap. Single source
// for every copy affordance in the app; the call sites used to disagree
// (1500 ms in the referral dialog, 2000 ms in the API key screen).
export const COPIED_FEEDBACK_MS = 1500;

// Shared copy-to-clipboard affordance. On tap the button turns green and a
// green "Copied" bubble pops above it. It is not a hover tooltip on purpose:
// this is a mobile PWA, so the feedback has to come from the tap itself.
export default function CopyButton({
    value,
    onError,
    size,
    backgroundColor,
    label,
    colorLabel,
    fontSizeLabel,
    gap,
}) {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // The button can unmount while the confirmation is still up (the deposit
    // screens swap it out when the invoice expires), so drop the pending timer.
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handlePress = async () => {
        try {
            await navigator.clipboard.writeText(value);
        } catch (error) {
            if (onError) {
                onError(error);
            }
            return;
        }
        setCopied(true);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(
            () => setCopied(false),
            COPIED_FEEDBACK_MS
        );
    };

    return (
        <YStack
            alignItems="center"
            justifyContent="center"
            gap={gap}
            position="relative"
        >
            {copied ? (
                <YStack
                    position="absolute"
                    paddingHorizontal={"$2.5"}
                    paddingVertical={"$1"}
                    borderRadius={"$3"}
                    backgroundColor={"$semanticGreen"}
                    style={{
                        bottom: "100%",
                        marginBottom: 6,
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                        zIndex: 1,
                    }}
                >
                    <Paragraph color={"$neutral13"} fontSize={"$5"}>
                        Copied
                    </Paragraph>
                </YStack>
            ) : null}
            <Button
                onPress={handlePress}
                aria-label={copied ? "Copied" : "Copy"}
                width={size ? size : "36px"}
                height={size ? size : "36px"}
                padding={0}
                backgroundColor={
                    copied ? "$semanticGreen" : backgroundColor || "$transparent"
                }
                borderRadius={"50%"}
                position="relative"
            >
                <Image
                    src={copyIcon}
                    alt="copy"
                    style={{ position: "absolute" }}
                />
            </Button>
            {label ? (
                <Paragraph color={colorLabel} fontSize={fontSizeLabel}>
                    {label}
                </Paragraph>
            ) : null}
        </YStack>
    );
}
