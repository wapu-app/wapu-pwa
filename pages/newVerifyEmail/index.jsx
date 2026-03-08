import React from "react";
import { H6, YStack } from "tamagui";
import TamaguiButton from "../../components/TamaguiButton";
import { useRouter } from "next/router";

export default function index() {
    const router = useRouter();
    return (
        <YStack
            height={"$height100"}
            width={"$width90"}
            justifyContent="space-between"
            alignItems="center"
            gap={"$8"}
            overflow="auto"
            scrollbarWidth="thin"
            paddingBottom="$5"
        >
            <H6 fontSize={"$6"} color={"$neutral13"} fontWeight={"$700"}>
                Your Email is verified
            </H6>
            <TamaguiButton
                text={"Go Home"}
                onClick={() => router.push("/home")}
            />
        </YStack>
    );
}
