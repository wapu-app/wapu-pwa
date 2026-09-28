"use client";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { XStack, YStack, Paragraph, Button } from "tamagui";
import argentinaFlag from "../../public/icons/argentinaFlag.svg";
import bitcoinIcon from "../../public/icons/bitcoin.svg";
import arrowsIcon from "../../public/icons/faster-arrow-left-right-icon.svg";

// Home entry point to /swaps, where a logged-in user buys bitcoin with pesos.
// Same frame as ExchangeRateCard, which sits right above it. The Home has no
// i18n, so the copy is in English like the rest of the page.
export default function BuyBitcoinCard() {
    const router = useRouter();

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
                <Paragraph color={"$neutral12"} fontSize={"$4"} fontWeight={"$2"}>
                    Buy Bitcoin without KYC
                </Paragraph>
                <XStack display="flex" alignItems="center" gap="$2">
                    <Image
                        src={argentinaFlag}
                        alt="ARS"
                        style={{ width: "20px", height: "20px" }}
                    />
                    <Image
                        src={arrowsIcon}
                        alt=""
                        style={{ width: "16px", height: "16px" }}
                    />
                    <Image
                        src={bitcoinIcon}
                        alt="Bitcoin"
                        style={{ width: "20px", height: "20px" }}
                    />
                </XStack>
            </YStack>
            <Button
                onPress={() => router.push("/swaps")}
                backgroundColor={"$pink500"}
                color={"$neutral12"}
                borderRadius={"$3.5"}
                paddingHorizontal={"$4"}
                fontWeight={"$3"}
                pressStyle={{ opacity: 0.85, backgroundColor: "$pink500" }}
                hoverStyle={{ backgroundColor: "$pink500" }}
            >
                Swaps
            </Button>
        </XStack>
    );
}
