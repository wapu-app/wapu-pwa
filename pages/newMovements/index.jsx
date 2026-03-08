import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Image from "next/image";
import moment from "moment";

import { XStack, YStack, Paragraph, ScrollView } from "tamagui";
import { getTransactions } from "../../api/api";
import TamaguiButton from "../../components/TamaguiButton";
import NewHeaderButton from "../../components/newHeaderButton";
import DepositIcon from "../../public/deposit_icon.svg";
import FastSendIcon from "../../public/fast_send_icon.svg";
import SendIcon from "../../public/send_icon.svg";
import WapuSendIcon from "../../public/wapu_send_icon.svg";

function Movement({ movement }) {
    const router = useRouter();

    const handleTransactionclick = (uuid) => {
        router.push("/newTransactionDetail/?id=" + uuid);
    };

    const amountColor = (transaction) => {
        const status = transaction.status.toLowerCase();
        const is_positive = transaction.is_positive;
        if (status === "canceled") {
            return "$semanticRed";
        }
        if (status === "completed") {
            if (is_positive) {
                return "$semanticGreen";
            } else {
                return "$neutral13";
            }
        }
        if (status === "pending") {
            return "$semanticGray";
        }
        return "$semanticGray";
    };

    const icon = (transaction) => {
        if (
            ["deposit", "pix_deposit", "payer_reward"].includes(
                transaction.type?.toLowerCase()
            )
        ) {
            return DepositIcon;
        } else if (transaction.type?.toLowerCase() === "fast_fiat_transfer") {
            return FastSendIcon;
        } else if (
            ["withdraw", "fiat_transfer"].includes(
                transaction.type?.toLowerCase()
            )
        ) {
            return SendIcon;
        } else if (transaction.type?.toLowerCase() === "send_inner_transf") {
            return WapuSendIcon;
        } else {
            return SendIcon;
        }
    };

    const typeAmount = (transaction) => {
        let amount = 0;
        if (transaction.type === "withdraw") {
            amount = transaction.total_amount_taken;
        }
        if (
            transaction.type === "send_inner_transf" ||
            transaction.type === "payer_reward" ||
            transaction.type === "fee_earnings" ||
            transaction.type === "referral_reward" ||
            transaction.type === "deposit" ||
            transaction.type === "pix_deposit" ||
            transaction.type === "receive_inner_transf" ||
            transaction.type === "fiat_transfer" ||
            transaction.type === "qr_payment" ||
            transaction.type === "fast_fiat_transfer"
        ) {
            amount = transaction.payment_amount;
        }
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    return (
        <XStack
            width={"$width100"}
            borderRadius={"$5"}
            borderWidth={"1"}
            borderColor={"$neutral7"}
            padding={"$2"}
            gap={"$2"}
            justifyContent="space-between"
            onPress={() => {
                handleTransactionclick(movement.transaction_id);
            }}
            alignContent="center"
            alignItems="center"
        >
            <XStack gap={"$3"} alignItems="flex-start">
                <Image src={icon(movement)} alt="icon" />

                <YStack>
                    <Paragraph color={"$neutral13"} size={"$4"} weight={"$1"}>
                        {movement.type_name}
                    </Paragraph>
                    <Paragraph color={"$neutral12"} size={"$5"} weight={"$1"}>
                        {movement.status}
                    </Paragraph>
                </YStack>
            </XStack>
            <YStack
                alignItems="flex-end"
                alignContent="flex-end"
                overflow="hidden"
                textOverflow="ellipsis"
                flexShrink={1}
                maxWidth="50%"
            >
                <Paragraph
                    color={amountColor(movement)}
                    size={"$4"}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    flexShrink={1}
                    weight={"$1"}
                >
                    {movement.is_positive ? "+" : "-"}
                    {typeAmount(movement)} {movement.payment_currency}
                </Paragraph>

                <Paragraph
                    color={"$neutral11"}
                    size={"$6"}
                    numberOfLines={1}
                    weight={"$1"}
                >
                    {moment(movement.created_at).format("MMM Do, YYYY")}
                </Paragraph>
            </YStack>
        </XStack>
    );
}

export default function index() {
    const [errorGettingMovements, setErrorGettingMovements] = useState(false);
    const [userMovements, setUserMovements] = useState([]);
    const router = useRouter();

    const handleBackClick = () => {
        router.back();
    };

    const fetchTransactions = async () => {
        try {
            const response = await getTransactions();
            if (response.status == 200) {
                setUserMovements(response.data.transactions);
            } else {
                setErrorGettingMovements(true);
            }
        } catch (error) {
            setErrorGettingMovements(true);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    return (
        <YStack
            height={"$height100"}
            width={"$width90"}
            gap={"$3.5"}
            paddingTop={"$3.5"}
            paddingBottom={"$3.5"}
        >
            <NewHeaderButton onClick={handleBackClick}>History</NewHeaderButton>
            {errorGettingMovements ? (
                <YStack
                    width={"$width100"}
                    height={"$height100"}
                    alignItems="center"
                    alignContent="center"
                    justifyContent="center"
                    gap={"$4"}
                >
                    <Paragraph
                        color="$neutral12"
                        weight="$2"
                        size="$4"
                        textAlign="center"
                    >
                        There was an error fetching your transactions. Please
                        try again later.
                    </Paragraph>
                    <TamaguiButton
                        text="Go Home"
                        onPress={() => router.push("/home")}
                    />
                </YStack>
            ) : (
                <ScrollView>
                    <YStack
                        gap={"$3"}
                        padding={"$3.5"}
                        paddingBottom={"$5"}
                        flexWrap="wrap"
                        height={"$height100"}
                        alignContent="center"
                        justifyContent="center"
                        alignItems="center"
                    >
                        {userMovements?.length == 0 ? (
                            <>
                                <Paragraph
                                    weight={"$1"}
                                    color={"$neutral12"}
                                    size={"$4"}
                                >
                                    You don't have transaction history yet
                                </Paragraph>
                            </>
                        ) : (
                            <>
                                {userMovements.map(
                                    (transaction) =>
                                        transaction && (
                                            <Movement movement={transaction} />
                                        )
                                )}{" "}
                            </>
                        )}
                    </YStack>
                </ScrollView>
            )}
        </YStack>
    );
}
