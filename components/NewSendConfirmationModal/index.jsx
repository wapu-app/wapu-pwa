import { YStack, XStack, Paragraph } from "tamagui";
import TamaguiButton from "../TamaguiButton";
import Image from "next/image";
import arrowVertical from "../../public/arrowVertical.svg";
import worldIcon from "../../public/worldIcon.svg";

const NewSendConfirmationModal = ({
    amount,
    currencyPayment,
    network,
    receiverName,
    receiverAccount,
    fee,
    exchangeRate,
    totalAmount,
    onConfirm,
}) => {
    return (
        <YStack
            flex={1}
            backgroundColor="$neutral1"
            height={"$height100"}
            width={"$width100"}
            justifyContent="space-between"
        >
            <YStack
                flexGrow={1}
                flexShrink={0}
                alignItems="center"
                justifyContent="flex-start"
                backgroundColor={"$neutral1"}
                shadowColor={"$pink900"}
                shadowRadius={"$4.5"}
                borderRadius={"$4.5"}
                borderLeftColor={"$pink700"}
                borderLeftWidth={"$6"}
                borderRightColor={"$pink700"}
                borderRightWidth={"$6"}
                padding={"$3.5"}
                marginTop={"$4"}
                gap={"$3.5"}
            >
                <Paragraph color="$neutral12" size="$1" weight={"$2"}>
                    Receive amount
                </Paragraph>
                <Paragraph color="white" size="$1" weight={"$2"}>
                    {amount} {currencyPayment}
                </Paragraph>
                <YStack
                    width="100%"
                    height={"$1"}
                    backgroundColor={"$neutral12"}
                    marginVertical={"$2"}
                />
                <XStack
                    justifyContent="space-between"
                    width="100%"
                    borderTopColor={"$6"}
                >
                    <XStack flexShrink={1}>
                        <Paragraph
                            color="$neutral11"
                            weight={"$2"}
                            size={"$4"}
                            textAlign="left"
                        >
                            Network
                        </Paragraph>
                    </XStack>
                    <XStack justifyContent="flex-end" flexShrink={1}>
                        <Paragraph
                            color="$neutral11"
                            weight={"$2"}
                            size={"$4"}
                            textAlign="right"
                        >
                            {network}
                        </Paragraph>
                    </XStack>
                </XStack>
                {network == "Bank transfer" ? (
                    <XStack
                        justifyContent="space-between"
                        width="100%"
                        borderTopColor={"$6"}
                    >
                        <XStack flexShrink={1}>
                            <Paragraph
                                color="$neutral11"
                                weight={"$2"}
                                size={"$4"}
                                textAlign="left"
                            >
                                Exchange ratio
                            </Paragraph>
                        </XStack>
                        <XStack justifyContent="flex-end" flexShrink={1}>
                            <Paragraph
                                color="$neutral11"
                                weight={"$2"}
                                size={"$4"}
                                textAlign="right"
                            >
                                1 USDT = {exchangeRate} ARS
                            </Paragraph>
                        </XStack>
                    </XStack>
                ) : (
                    <></>
                )}
                <XStack justifyContent="space-between" width={"$width100"}>
                    <XStack flexShrink={1}>
                        <Paragraph
                            color="$neutral11"
                            weight={"$2"}
                            size={"$4"}
                            textAlign="left"
                        >
                            Transaction fee
                        </Paragraph>
                    </XStack>
                    <XStack justifyContent="flex-end" flexShrink={1}>
                        <Paragraph
                            color="$neutral11"
                            weight={"$2"}
                            size={"$4"}
                            textAlign="right"
                        >
                            {fee} USDT
                        </Paragraph>
                    </XStack>
                </XStack>
                <XStack justifyContent="space-between" width="100%">
                    <Paragraph
                        color="$neutral13"
                        weight={"$2"}
                        size={"$3"}
                        textAlign="left"
                    >
                        Total amount
                    </Paragraph>
                    <Paragraph
                        color="$neutral13"
                        weight={"$2"}
                        size={"$3"}
                        textAlign="right"
                    >
                        {totalAmount} USDT
                    </Paragraph>
                </XStack>
                <YStack alignItems="center">
                    <Image
                        src={arrowVertical}
                        alt="Arrow Down"
                        width={32}
                        height={90}
                    />
                </YStack>
                <XStack
                    width="100%"
                    justifyContent="flex-start"
                    numberOfLines={2}
                    whiteSpace="normal"
                    overflow="hidden"
                    wordBreak="break-word"
                >
                    <YStack gap={"$5"}>
                        <Paragraph color="$neutral10" weight={"$2"} size={"$2"}>
                            To
                        </Paragraph>
                        <XStack alignItems="center" gap="$4">
                            <Image src={worldIcon} alt="World Icon" />
                            <YStack>
                                <Paragraph
                                    color="$neutral13"
                                    weight={"$1"}
                                    size={"$3"}
                                >
                                    {receiverName || "Unknown name"}
                                </Paragraph>
                                <Paragraph
                                    color="$neutral10"
                                    weight={"$2"}
                                    size={"$5"}
                                    textAlign="left"
                                >
                                    {receiverAccount &&
                                    receiverAccount.length > 25
                                        ? `${receiverAccount.slice(
                                              0,
                                              10
                                          )}...${receiverAccount.slice(-5)}`
                                        : receiverAccount ||
                                          "CBU, Alias or Wallet"}
                                </Paragraph>
                            </YStack>
                        </XStack>
                    </YStack>
                </XStack>
            </YStack>
            <Paragraph
                color="$neutral9"
                size={"$5"}
                textAlign="center"
                paddingTop="$4"
                paddingBottom="$4"
                weight={"$2"}
            >
                The money will be taken from your USDT account
            </Paragraph>
            <TamaguiButton onClick={onConfirm} text={"Confirm"} />
        </YStack>
    );
};

export default NewSendConfirmationModal;
