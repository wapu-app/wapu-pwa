import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useUserContext } from "../../context/userContext";
import { YStack, XStack, Paragraph, Button, Text } from "tamagui";
import {
    getOuterYStackProps,
    midYStackProps,
    getTextProps,
    buttonProps,
    messageXStackProps,
} from "../../utils/styleProps";
import { getAccessToken } from "../../utils/auth";
import { isValidAmount } from "../../utils/validations";
import Image from "next/image";
import arrowPurple from "../../public/arrowPurple.svg";
import arrowWhite from "../../public/arrowWhite.svg";
import messageIcon from "../../public/message.svg";
import ContactsList from "../../components/ContactsList";
import ErrorModal from "../../components/ErrorModal";
import TamaguiInput from "../../components/TamaguiInput";
import TamaguiButton from "../../components/TamaguiButton";
import NewHeaderButton from "../../components/newHeaderButton";
import NewSendConfirmationModal from "../../components/NewSendConfirmationModal";
import {
    getSettings,
    sendFiat,
    getTransactionTentativeAmount,
} from "../../api/api";

export default function index() {
    const router = useRouter();
    const { user } = useUserContext();
    const [step, setStep] = useState(1);
    const [mode, setMode] = useState("");
    const [amount, setAmount] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [receiverAccount, setReceiverAccount] = useState("");
    const [transactionType, setTransactionType] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [errorModalState, setErrorModalState] = useState(false);
    const [buttonText, setButtonText] = useState("Send");
    const [accessToken, setAccessToken] = useState(null);
    const [fee, setFee] = useState(null);
    const [fastTransferFee, setFastTransferFee] = useState(null);
    const [transferFee, setTransferFee] = useState(null);
    const [minPaymentAmount, setMinPaymentAmount] = useState(null);
    const [tentativeTransactionDetails, setTentativeTransactionDetails] =
        useState(null);
    const currencyPayment = "ARS";
    const currencyTaken = "USDT";

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const token = await getAccessToken();
                setAccessToken(token);
            } catch (error) {
                console.error("Failed to get access token", error);
            }
        };

        const fetchSettings = async () => {
            try {
                const settings = await getSettings();
                if (settings) {
                    setMinPaymentAmount(settings.min_payment_amount_ars);
                    setFastTransferFee(settings.fast_fiat_transfer_fee);
                    setTransferFee(settings.fiat_transfer_fee);
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            }
        };

        fetchToken();
        fetchSettings();
    }, []);

    async function fetchTransactionTentativeAmount() {
        const parsedAmount = parseFloat(amount.replace(/,/g, ""));
        try {
            const payload = {
                amount: parsedAmount,
                currency_payment: currencyPayment,
                currency_taken: currencyTaken,
                type: transactionType,
            };

            const { data } = await getTransactionTentativeAmount(payload);
            setTentativeTransactionDetails(data);
        } catch (error) {
            console.error(
                "Error fetching tentative transaction details:",
                error
            );
        }
    }

    function handleContactSelect(contact) {
        // Set receiver name if available
        if (contact.name_label) {
            setReceiverName(contact.name_label);
        }
        
        // Use the selectedAddress which contains the correct address based on priority
        if (contact.selectedAddress) {
            setReceiverAccount(contact.selectedAddress);
        }
    }

    function handleBack() {
        if (step > 1) {
            if (step - 1 === 1) {
                setMode("");
            }
            setErrorMessage("");
            setStep(step - 1);
        } else {
            router.back();
        }
    }

    const handleSendOptionClick = async (mode) => {
        setStep(2);
        if (mode) {
            if (mode === "fast") {
                setFee(fastTransferFee);
                setTransactionType("fast_fiat_transfer");
                setButtonText("Fast Send");
            } else {
                setFee(transferFee);
                setTransactionType("fiat_transfer");
                setButtonText("Send Fiat");
            }
        }
    };

    const handleAmountChange = (value) => {
        if (isValidAmount(value)) {
            setAmount(value);
            if (value < minPaymentAmount) {
                setErrorMessage(
                    `You have to send a minimum of $${minPaymentAmount.toLocaleString(
                        "en-US",
                        { currency: "ARS" }
                    )} Pesos.`
                );
                return;
            }

            if (value > user.combinedBalance) {
                setErrorMessage("You don't have enough money to send this amount.");
                return;
            }

            setErrorMessage("");
        }
    };

    const isRecipientButtonDisabled = () => {
        return receiverAccount.trim() === "";
    };

    const isAmountButtonDisabled = () => {
        const numericAmount = parseFloat(amount.replace(/,/g, ""));
        return (
            isNaN(numericAmount) ||
            numericAmount < minPaymentAmount ||
            numericAmount > user.combinedBalance
        );
    };

    const handleNext = async () => {
        setStep(step + 1);
        if (step === 3) {
            await fetchTransactionTentativeAmount();
        }
    };

    const maxAmount = () => {
        if (
            typeof fee === "number" &&
            user?.usdtBalance !== undefined &&
            user?.rateUsdtArsBuy !== undefined
        ) {
            let result = Math.floor(
                // We are hardcoding to keep 0.01% to make the MAX work up to $1000 usd
                (user.usdtBalance - user.usdtBalance * 0.01) *
                    (1 - fee / 100) *
                    user.rateUsdtArsBuy
            );

            setAmount(String(result));
            setErrorMessage("");
        } else {
            setErrorMessage(
                "Unable to calculate max amount. Please check your balance and fee."
            );
        }
    };

    const handleConfirm = async () => {
        if (!accessToken) {
            console.error("No access token available.");
            return;
        }

        const numericAmount = parseFloat(amount.replace(/,/g, ""));
        if (isNaN(numericAmount)) {
            setErrorMessage("Invalid amount.");
            return;
        }

        if (!transactionType) {
            console.error("Transaction type is not defined.");
            return;
        }

        const payload = {
            receiver_name: receiverName,
            alias: receiverAccount,
            currency_taken: currencyTaken,
            type: transactionType,
            payment_amount: numericAmount,
        };

        try {
            const response = await sendFiat(payload);

            const data = response.data;

            if (response.status === 201) {
                router.push(
                    "/newTransactionPending?id=" +
                        data.transaction_id +
                        "&transaction_type=" +
                        transactionType
                );
            } else {
                console.error("Error:", data.message);
                setErrorMessage(data.error);
                setErrorModalState(true);
            }
        } catch (error) {
            console.error("Failed to send the transaction", error);
        }
    };

    const outerYStackProps = getOuterYStackProps(mode);
    const textProps = getTextProps(mode);

    return (
        <YStack {...outerYStackProps}>
            <ErrorModal
                message={errorMessage}
                state={errorModalState}
                errorModalOnRequestClose={() => setErrorModalState(false)}
            />
            <NewHeaderButton onClick={handleBack}>{buttonText}</NewHeaderButton>
            {step === 1 && (
                <>
                    <Text {...textProps}>
                        How do you want to send ARS (Argentine Peso)?
                    </Text>
                    <YStack width="90%" gap="$4">
                        <Button
                            width="100%"
                            height={"$12"}
                            backgroundColor={"$neutral3"}
                            borderRadius={"$4"}
                            justifyContent="flex-start"
                            paddingHorizontal={"$2"}
                            onPress={() => handleSendOptionClick("fast")}
                        >
                            <XStack
                                justifyContent="flex-start"
                                alignItems="center"
                                paddingLeft={"$2"}
                            >
                                <Image
                                    src={arrowPurple}
                                    alt="Purple Arrow Icon"
                                />
                                <YStack
                                    alignItems="flex-start"
                                    paddingLeft={"$4"}
                                >
                                    <Paragraph
                                        color={"$neutral13"}
                                        fontWeight={"$2"}
                                        fontSize={"$2"}
                                    >
                                        ⚡ Fast Send (~2h)
                                    </Paragraph>
                                    <Paragraph
                                        color={"$neutral10"}
                                        size={"$5"}
                                        fontWeight={"$2"}
                                    >
                                        {user.fastFiatTransferFee ? (user.fastFiatTransferFee * 100).toFixed(2) : 4}% of Transaction cost
                                    </Paragraph>
                                </YStack>
                            </XStack>
                        </Button>
                        <Button
                            width="100%"
                            height={"$12"}
                            backgroundColor={"$neutral3"}
                            borderRadius={"$4"}
                            justifyContent="flex-start"
                            paddingHorizontal={"$2"}
                            onPress={() => handleSendOptionClick("regular")}
                        >
                            <XStack
                                justifyContent="flex-start"
                                alignItems="center"
                                paddingLeft="$2"
                            >
                                <Image
                                    src={arrowWhite}
                                    alt="White Arrow Icon"
                                />
                                <YStack
                                    alignItems="flex-start"
                                    paddingLeft={"$4"}
                                >
                                    <Paragraph
                                        color={"$neutral13"}
                                        fontWeight={"$2"}
                                        fontSize={"$2"}
                                    >
                                        Standard Send (~24h)
                                    </Paragraph>
                                    <Paragraph
                                        color={"$neutral10"}
                                        size={"$5"}
                                        fontWeight={"$2"}
                                    >
                                        {user.fiatTransferFee ? (user.fiatTransferFee * 100).toFixed(2) : 2}% of Transaction cost
                                    </Paragraph>
                                </YStack>
                            </XStack>
                        </Button>
                    </YStack>
                </>
            )}{" "}
            {step === 2 && (
                <YStack {...midYStackProps}>
                    <YStack>
                        <Text {...textProps}>To whom do you want to transfer?</Text>
                        <YStack width="100%" gap="$6">
                            <TamaguiInput
                                value={receiverName}
                                onChange={setReceiverName}
                                label={"Receiver name"}
                                placeholder={"Name of receiver (optional)"}
                            />
                            <TamaguiInput
                                value={receiverAccount}
                                onChange={setReceiverAccount}
                                label={"Address of receiver"}
                                placeholder={"Address or Wapu ID"}
                                required
                            />
                        </YStack>
                        
                        {/* Contacts Section */}
                        {user.showRecentFavContacts && (
                            <ContactsList 
                                filterBy="FIAT"
                                onContactSelect={handleContactSelect}
                            />
                        )}
                    </YStack>
                    <YStack justifyContent="space-between" gap="$4">
                        <TamaguiButton
                            onClick={handleNext}
                            text={"Next"}
                            isDisabled={isRecipientButtonDisabled()}
                        />
                    </YStack>
                </YStack>
            )}{" "}
            {step === 3 && (
                <YStack {...midYStackProps}>
                    <YStack>
                        <Text {...textProps}>
                            How much do you want to send?
                        </Text>
                        <YStack width="100%" gap="$6">
                            <XStack
                                position="relative"
                                width="100%"
                                alignItems="center"
                            >
                                <TamaguiInput
                                    value={amount}
                                    onChange={handleAmountChange}
                                    label={"Amount"}
                                    placeholder="Enter Amount"
                                    error={!!errorMessage}
                                    keyboardType="decimal-pad"
                                />
                                <Text
                                    position="absolute"
                                    right="$2.5"
                                    bottom="$2.5"
                                    color="$neutral11"
                                >
                                    ARS |{" "}
                                    <button
                                        onClick={maxAmount}
                                        style={buttonProps}
                                    >
                                        Max
                                    </button>
                                </Text>
                            </XStack>
                            {errorMessage || amount === "" || amount === "0" ? (
                                <XStack {...messageXStackProps}>
                                    <Image
                                        src={messageIcon}
                                        alt="Message Icon"
                                        style={{
                                            filter: errorMessage
                                                ? "invert(16%) sepia(83%) saturate(6171%) hue-rotate(356deg) brightness(97%) contrast(116%)"
                                                : "none",
                                        }}
                                    />
                                    <YStack
                                        alignItems="flex-start"
                                        paddingLeft={"$4"}
                                        width="90%"
                                    >
                                        <Paragraph
                                            color={
                                                errorMessage
                                                    ? "red"
                                                    : "$neutral11"
                                            }
                                        >
                                            {errorMessage ||
                                                `You have to send a minimum of $${minPaymentAmount.toLocaleString(
                                                    "en-US",
                                                    { currency: "ARS" }
                                                )} Pesos.`}
                                        </Paragraph>
                                    </YStack>
                                </XStack>
                            ) : null}
                        </YStack>
                    </YStack>
                    <YStack justifyContent="space-between" gap="$4">
                        <TamaguiButton
                            onClick={handleNext}
                            text={"Next"}
                            isDisabled={isAmountButtonDisabled()}
                        />
                    </YStack>
                </YStack>
            )}
            {step === 4 && (
                <NewSendConfirmationModal
                    amount={amount}
                    currencyPayment={currencyPayment}
                    network="Bank transfer"
                    receiverName={receiverName}
                    receiverAccount={receiverAccount}
                    fee={tentativeTransactionDetails?.fee}
                    exchangeRate={tentativeTransactionDetails?.exchange_rate}
                    totalAmount={tentativeTransactionDetails?.total_amount}
                    onConfirm={handleConfirm}
                />
            )}
        </YStack>
    );
}
