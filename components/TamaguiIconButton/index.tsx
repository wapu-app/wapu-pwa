import React from "react";
import Image from "next/image";
import { Button, Paragraph, YStack } from "tamagui";
export default function TamaguiIconButton({
    icon,
    onClick,
    isDisabled,
    size /* in pixels */,
    backgroundColor,
    borderColor,
    notification,
    gap,
    label,
    colorLabel,
    fontSizeLabel,
    fontWeightLabel,
    style
}) {
    return (
        <YStack
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={gap}
            style={style}
        >
            <Button
                disabled={isDisabled ? true : false}
                onPress={onClick}
                width={size ? size : "36px"}
                height={size ? size : "36px"}
                padding={0}
                backgroundColor={
                    backgroundColor
                        ? backgroundColor
                        : `$transparent` /* default */
                }
                borderRadius={"50%"}
                borderColor={borderColor}
                position="relative"
            >
                <Image src={icon} alt="icon" style={{ position: "absolute" }} />
                {notification ? (
                    <div
                        style={{
                            width: "8px",
                            height: "8px",
                            backgroundColor: "#E7357C",
                            position: "absolute",
                            left: "55%",
                            top: "25%",
                            borderRadius: "50%",
                        }}
                    ></div>
                ) : (
                    ""
                )}
            </Button>
            <Paragraph
                color={colorLabel}
                fontSize={fontSizeLabel}
                fontWeight={fontWeightLabel}
            >
                {label}
            </Paragraph>
        </YStack>
    );
}
