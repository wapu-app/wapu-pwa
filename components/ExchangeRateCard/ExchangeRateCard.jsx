"use client";
import React from "react";
import Image from "next/image";
import { XStack, YStack, Paragraph } from "tamagui";
import { useUserContext } from "../../context/userContext";
import argentinaFlag from "../../public/icons/argentinaFlag.svg";
import usdtIcon from "../../public/icons/USDT.svg";

export default function ExchangeRateCard() {
    const { user } = useUserContext();

    return (
        <XStack
            width="$width90"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            paddingLeft={"$3.5"}
            paddingRight={"$3.5"}
            paddingTop={"$5"}
            paddingBottom={"$5"}
            borderRadius={"$4.5"}
            backgroundColor={"$neutral3"}
        >
            <YStack display="flex" gap="$2">
                <Paragraph
                    color={"$neutral12"}
                    fontSize={"$4"}
                    fontWeight={"$2"}
                >
                    Today's Exchange Rate
                </Paragraph>
                <XStack display="flex" alignItems="center" gap="$2.5">
                    <Image
                        src={usdtIcon}
                        alt="USDT"
                        style={{ width: "24px", height: "24px" }}
                    />
                    <Paragraph
                        color={"$neutral11"}
                        fontSize={"$3"}
                        fontWeight={"$1"}
                    >
                        USDT
                    </Paragraph>
                </XStack>
            </YStack>
            <YStack display="flex" alignItems="flex-end" gap="$2">
                <XStack
                    display="flex"
                    alignItems="center"
                    gap="$2"
                    backgroundColor={"$neutral4"}
                    paddingLeft={"$2.5"}
                    paddingRight={"$2.5"}
                    paddingTop={"$2"}
                    paddingBottom={"$2"}
                    borderRadius={"$3.5"}
                >
                    <Image
                        src={argentinaFlag}
                        alt="Argentina"
                        style={{ width: "20px", height: "20px" }}
                    />
                    <Paragraph
                        color={"$neutral12"}
                        fontSize={"$5"}
                        fontWeight={"$3"}
                    >
                        ${user.rateUsdtArsBuy || "---"}
                    </Paragraph>
                </XStack>
                <Paragraph
                    color={"$neutral11"}
                    fontSize={"$2"}
                    fontWeight={"$1"}
                >
                    Buy Price
                </Paragraph>
            </YStack>
        </XStack>
    );
}
