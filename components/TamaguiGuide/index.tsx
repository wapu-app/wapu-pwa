import React from "react";
import { YStack, XStack, styled, Paragraph } from "tamagui";
import Image from "next/image";

const CustomYStack = styled(YStack, {
    width: "$width100",
    padding: "$4.5",
    backgroundColor: "$neutral3",
    borderRadius: "$6",
    display: "flex",
    alignItems: "flex-start",
    gap: "$2.5",
});
const CustomXStack = styled(XStack, {
    width: "$width100",
    display: "flex",
    alignItems: "flex-start",
    gap: "$2",
});
export default function TamaguiGuide({ text, icon, type }) {
    const CustomText = styled(Paragraph, {
        color:
            type == "success"
                ? "$semanticGreen"
                : type == "error"
                ? "$semanticRed"
                : "$neutral11",
    });
    return (
        <CustomYStack>
            {type === "error" && (
                <CustomXStack>
                    <Image src={icon} alt="icon" />
                    <CustomText>{text}</CustomText>
                </CustomXStack>
            )}
            {type === "info" && (
                <CustomXStack>
                    <Image src={icon} alt="icon" />
                    <CustomText>{text}</CustomText>
                </CustomXStack>
            )}
            {type === "success" && (
                <CustomXStack>
                    <Image src={icon} alt="icon" />
                    <CustomText>{text}</CustomText>
                </CustomXStack>
            )}
        </CustomYStack>
    );
}
