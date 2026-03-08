import { useRouter } from "next/router";
import { useState, useEffect } from "react";

import { YStack, XStack, Paragraph, Separator } from "tamagui";
import TamaguiButton from "../../components/TamaguiButton";
import TamaguiIconButton from "../../components/TamaguiIconButton";
import NewHeaderButton from "../../components/newHeaderButton";
import Image from "next/image";
import { cancelTransaction } from "../../utils/cancelPayment";
import NetworkIcon from "../../public/network_icon.svg";
import CopyIcon from "../../public/copy_icon.svg";

import { getTransaction } from "../../api/api";

const StatusBackgroundColor = {
    pending: "$semanticYellow",
    canceled: "$semanticRed",
    completed: "$semanticGreen",
};

const StatusFontColor = {
    pending: "$neutral1",
    canceled: "$neutral12",
    completed: "$neutral12",
};

export default function index() {
    const router = useRouter();

    const [transactionStatus, setTransactionStatus] = useState("");
    const [movement, setMovement] = useState({});
    const [statusColor, setStatusColor] = useState("$neutral1");
    const [statusLetterColor, setStatusLetterColor] = useState("$neutral1");
    const [backhome, setBackHome] = useState(false);

    const query = router.query;

    const fetchTransaction = async (id) => {
        try {
            const { data } = await getTransaction(id);
            setMovement(data);
            setTransactionStatus(data.status);
            setStatusColor(StatusBackgroundColor[data.status.toLowerCase()]);
            setStatusLetterColor(StatusFontColor[data.status.toLowerCase()]);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (typeof query.id !== "undefined") {
            fetchTransaction(query.id);
        }

        if (
            typeof query.back !== "undefined" &&
            query.back.toLowerCase() == "home"
        ) {
            setBackHome(true);
        }
    }, [query]);

    const handleBackClick = () => {
        if (backhome) {
            router.push("/home");
        } else {
            router.back();
        }
    };

    return (
        <YStack
            flex={1}
            backgroundColor="$neutral1"
            height={"$height100"}
            width={"$width90"}
            marginTop={"$3"}
            marginBottom={"$3"}
            marginLeft={"$5"}
            marginRight={"$5"}
            justifyContent="space-between"
        >
            <YStack gap={"$5"}>
                <NewHeaderButton
                    onClick={handleBackClick}
                    isCloseButton={true}
                ></NewHeaderButton>
                <YStack
                    alignItems="center"
                    justifyContent="flex-start"
                    backgroundColor={"$neutral1"}
                    shadowColor={"$pink900"}
                    shadowRadius={"$4.5"}
                    borderRadius={"$4.5"}
                    borderTopColor={"$pink700"}
                    borderTopWidth={"$6"}
                    borderBottomColor={"$pink700"}
                    borderBottomWidth={"$6"}
                    padding={"$3.5"}
                    gap={"$3.5"}
                >
                    <YStack
                        width={"$width100"}
                        alignItems="center"
                        gap={"$2"}
                        marginBottom={"$4"}
                    >
                        <Paragraph
                            color={"$neutral12"}
                            textAlign="center"
                            weight={"$2"}
                            size={"$1"}
                        >
                            {movement.type_name}
                        </Paragraph>
                        <Paragraph
                            color={"$neutral12"}
                            textAlign="center"
                            weight={"$2"}
                            size={"$1"}
                        >
                            {movement.payment_amount}{" "}
                            {movement.payment_currency}
                        </Paragraph>
                    </YStack>
                    <Separator
                        alignSelf="stretch"
                        horizontal="true"
                        marginHorizontal={15}
                    />

                    <YStack width={"$width100"} alignItems="center" gap={"$2"}>
                        <XStack
                            justifyContent="space-between"
                            width={"$width90"}
                        >
                            <Paragraph
                                color={"$neutral10"}
                                textAlign="center"
                                weight={"$2"}
                                size={"$3"}
                            >
                                Date
                            </Paragraph>
                            <Paragraph
                                color={"$neutral12"}
                                textAlign="center"
                                weight={"$2"}
                                size={"$4"}
                            >
                                {movement.created_at}
                            </Paragraph>
                        </XStack>
                        <XStack
                            justifyContent="space-between"
                            width={"$width90"}
                        >
                            <Paragraph
                                color={"$neutral10"}
                                textAlign="center"
                                weight={"$2"}
                                size={"$3"}
                            >
                                Status
                            </Paragraph>
                            <Paragraph
                                color={statusLetterColor}
                                textAlign="center"
                                backgroundColor={statusColor}
                                borderRadius={"$3.5"}
                                paddingLeft={"$2"}
                                paddingRight={"$2"}
                                size={"$4"}
                                weight={"$2"}
                            >
                                {movement.status}
                            </Paragraph>
                        </XStack>
                    </YStack>
                    {/* QR payment and pix deposit are ignored in the details section */}
                    {[
                        "fiat_transfer",
                        "fast_fiat_transfer",
                        "send_inner_transf",
                    ].includes(movement.type?.toLowerCase()) ? (
                        <>
                            <Separator
                                alignSelf="stretch"
                                horizontal="true"
                                marginHorizontal={15}
                            />

                            <XStack
                                justifyContent="space-between"
                                width={"$width90"}
                                alignContent="center"
                                alignItems="center"
                            >
                                <YStack gap="$2">
                                    <Paragraph
                                        color={"$neutral10"}
                                        textAlign="left"
                                        size={"$2"}
                                        weight={"$2"}
                                    >
                                        To
                                    </Paragraph>
                                    <Image src={NetworkIcon} alt="icon" />
                                </YStack>
                                <YStack
                                    justifyContent="center"
                                    gap="$2"
                                    overflow="hidden"
                                    textoverflow="ellipsis"
                                    width={"60%"}
                                >
                                    <Paragraph
                                        color={"$neutral12"}
                                        textAlign="left"
                                        size={"$3"}
                                        weight={"$1"}
                                        numberOfLines={1}
                                    >
                                        {movement.receiver_name}
                                    </Paragraph>
                                    <Paragraph
                                        color={"$neutral10"}
                                        textAlign="left"
                                        size={"$4"}
                                        weight={"$1"}
                                        numberOfLines={1}
                                    >
                                        {movement.alias}
                                    </Paragraph>
                                </YStack>
                            </XStack>
                        </>
                    ) : (
                        <></>
                    )}
                    {["deposit", "withdraw"].includes(
                        movement.type?.toLowerCase()
                    ) ? (
                        <YStack
                            width={"$width100"}
                            alignItems="center"
                            gap={"$2"}
                        >
                            <Separator
                                alignSelf="stretch"
                                horizontal="true"
                                marginHorizontal={15}
                            />
                            <XStack
                                justifyContent="space-between"
                                width={"$width90"}
                                alignContent="center"
                                alignItems="center"
                            >
                                <YStack justifyContent="center" gap="$2">
                                    <Paragraph
                                        color={"$neutral10"}
                                        textAlign="left"
                                        size={"$2"}
                                        weight={"$2"}
                                    >
                                        To
                                    </Paragraph>
                                    <Paragraph
                                        color={"$neutral10"}
                                        textAlign="left"
                                        size={"$2"}
                                        weight={"$2"}
                                    >
                                        Network
                                    </Paragraph>
                                </YStack>
                                <YStack
                                    justifyContent="center"
                                    gap="$2"
                                    overflow="hidden"
                                    textoverflow="ellipsis"
                                    width={"60%"}
                                >
                                    <Paragraph
                                        color={"$neutral12"}
                                        textAlign="center"
                                        size={"$3"}
                                        weight={"$1"}
                                        numberOfLines={1}
                                    >
                                        {movement.address_destination}
                                    </Paragraph>
                                    <Paragraph
                                        color={"$neutral10"}
                                        textAlign="center"
                                        size={"$4"}
                                        weight={"$1"}
                                        numberOfLines={1}
                                    >
                                        {movement.network}
                                    </Paragraph>
                                </YStack>
                            </XStack>
                        </YStack>
                    ) : (
                        <></>
                    )}

                    <Separator
                        alignSelf="stretch"
                        horizontal="true"
                        marginHorizontal={15}
                    />

                    <YStack
                        width={"$width100"}
                        alignItems="center"
                        paddingBottom={"$5"}
                        gap={"$2"}
                    >
                        <XStack
                            justifyContent="space-between"
                            width={"$width90"}
                            alignContent="center"
                            alignItems="center"
                        >
                            <Paragraph
                                color={"$neutral10"}
                                textAlign="center"
                                size={"$4"}
                                weight={"$2"}
                            >
                                Transaction ID
                            </Paragraph>
                            <XStack
                                width="40%"
                                overflow="hidden"
                                textoverflow="ellipsis"
                                alignContent="center"
                                alignItems="center"
                            >
                                <Paragraph
                                    color={"$neutral10"}
                                    textAlign="center"
                                    size={"$4"}
                                    weight={"$2"}
                                    numberOfLines={1}
                                >
                                    {movement.transaction_id}
                                </Paragraph>

                                <TamaguiIconButton
                                    icon={CopyIcon}
                                    onClick={() => {
                                        navigator.clipboard.writeText(
                                            movement.transaction_id
                                        );
                                    }}
                                />
                            </XStack>
                        </XStack>
                        <XStack
                            justifyContent="space-between"
                            width={"$width90"}
                        >
                            <Paragraph
                                color={"$neutral10"}
                                textAlign="center"
                                size={"$4"}
                                weight={"$2"}
                            >
                                Transaction fee
                            </Paragraph>
                            <Paragraph
                                color={"$neutral10"}
                                textAlign="center"
                                size={"$4"}
                                weight={"$2"}
                            >
                                {movement.fee_taken} {movement.currency_taken}
                            </Paragraph>
                        </XStack>
                        <XStack
                            justifyContent="space-between"
                            width={"$width90"}
                        >
                            <Paragraph
                                color={"$neutral13"}
                                textAlign="center"
                                weight={"$2"}
                                size={"$3"}
                            >
                                Total
                            </Paragraph>
                            <Paragraph
                                color={"$neutral13"}
                                textAlign="center"
                                weight={"$2"}
                                size={"$3"}
                            >
                                ${movement?.total_amount_taken}{" "}
                                {movement.currency_taken}
                            </Paragraph>
                        </XStack>
                    </YStack>
                </YStack>
            </YStack>

            <YStack gap={"$3"}>
                {transactionStatus.toLowerCase() === "pending" ? (
                    <XStack
                        marginLeft={"$5"}
                        marginRight={"$5"}
                        alignItems="center"
                    >
                        <Paragraph
                            textAlign="center"
                            color={"$neutral10"}
                            size={"$4"}
                            weight={"$1"}
                            letterSpacing={"$1"}
                        >
                            You will be notified by email when the transaction
                            is completed.
                        </Paragraph>
                    </XStack>
                ) : (
                    <></>
                )}

                {transactionStatus.toLowerCase() === "pending" &&
                movement.type.toLowerCase() !== "deposit" &&
                movement.type.toLowerCase() !== "pix_deposit" &&
                movement.type.toLowerCase() !== "withdraw" ? (
                    <TamaguiButton
                        secondary={true}
                        onClick={async () => {
                            await cancelTransaction(movement.transaction_id);
                            fetchTransaction(movement.transaction_id);
                        }}
                        text="Cancel"
                    />
                ) : (
                    <></>
                )}

                {movement.receipt_image_url !== null ? (
                    <XStack width={"$with100"} alignItems="center">
                        <TamaguiButton
                            text={"View Receipt"}
                            href={movement.receipt_image_url}
                        />
                    </XStack>
                ) : (
                    <></>
                )}
            </YStack>
        </YStack>
    );
}
