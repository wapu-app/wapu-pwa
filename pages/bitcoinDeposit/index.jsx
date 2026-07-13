import { useState, useEffect } from "react";
import { YStack, H6, Paragraph, XStack } from "tamagui";
import { useRouter } from "next/router";
import QRCode from "qrcode.react";
import Image from "next/image";

import ErrorModal from "../../components/ErrorModal";
import TamaguiButton from "../../components/TamaguiButton";
import TamaguiInput from "../../components/TamaguiInput";
import { TamaguiSelect } from "../../components/TamaguiSelect";
import NewHeaderButton from "../../components/newHeaderButton";

import WarningIcon from "../../public/warning_icon.svg";
import CopyIcon from "../../public/copy_icon.svg";

import {postDeposit, postDepositLightning} from "../../api/api";

import { useUserContext } from "../../context/userContext";
import useTransactionStatus from "../../utils/useTransactionStatus";

const LIGHTNING_INVOICE_FALLBACK_TTL_MS = 15 * 60 * 1000; // used only if the backend timestamps are missing/invalid

// Time-to-live of a Lightning invoice, derived from the backend's own window
// (expires_at - created_at). Both timestamps are serialized in the same timezone,
// so their difference is the real validity window regardless of how the browser
// parses them. Anchored at the moment of receipt; falls back to 15 min.
function getLightningInvoiceTtlMs(createdAt, expiresAt) {
    const parse = (s) => new Date(String(s).replace(" ", "T")).getTime();
    const durationMs = parse(expiresAt) - parse(createdAt);
    return Number.isFinite(durationMs) && durationMs > 0
        ? durationMs
        : LIGHTNING_INVOICE_FALLBACK_TTL_MS;
}

export default function BitcoinDeposit() {
    const router = useRouter();
    const { getUser, user } = useUserContext();
    const [step, setStep] = useState(1);
    const [currency, setCurrency] = useState("SAT");
    const [amount, setAmount] = useState("");
    const [invoice, setInvoice] = useState("");
    const [minDepositAmount, setMinDepositAmount] = useState("");
    const [transactionId, setTransactionId] = useState(null);
    const [amountError, setAmountError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [errorModalState, setErrorModalState] = useState(false);
    const [transactionID , setTransactionID] = useState("");
    const [transactionStatus, setTransactionStatus] = useState("");
    const [showAbortButton, setShowAbortButton] = useState(false);
    const [expired, setExpired] = useState(false);
    const [expiryEpoch, setExpiryEpoch] = useState(null);
    const [remainingMs, setRemainingMs] = useState(null);


    useTransactionStatus(
        transactionID,
        transactionStatus,
        setTransactionStatus,
        setShowAbortButton
    );

    const handleAmountChange = (value) => {
        setAmountError(false);
        const usdValuePattern = /^\d+(\\d+)?$/;
        setAmount(value);
        const minAmount = parseFloat(minDepositAmount);
        const enteredAmount = parseFloat(satoshisToDollars(value, user.rateBtcUsdBuy));
        if (
            !usdValuePattern.test(value) ||
            (minAmount && enteredAmount < minAmount)
        ) {
            setAmountError(true);
        }
    };

    const handleIconPressed = () => {
        navigator.clipboard.writeText(invoice);
    };

    const resetToAmountStep = () => {
        setStep(1);
        setInvoice("");
        setAmount("");
        setExpired(false);
        setExpiryEpoch(null);
        setRemainingMs(null);
        setTransactionID("");
        setTransactionId(null);
    };

    const handleBack = () => {
        if (step === 2) {
            resetToAmountStep();
        } else {
            router.back();
        }
    };

    const handleContinue = async (e) => {
        if (step === 1) {
            const payload = {
                amount: amount,
            };

            try {
                const { data, status } = await postDepositLightning(payload);

                if (status === 200 || status === 201) {
                    setTransactionId(data.transaction_id);
                    setInvoice(data.lnurl_pr_invoice);
                    setTransactionID(data.transaction_id);
                    setExpired(false);
                    setExpiryEpoch(
                        Date.now() + getLightningInvoiceTtlMs(data.created_at, data.expires_at)
                    );
                    setStep(2);
                } else if (status >= 400 && status <= 500) {
                    setErrorMessage(data.error);
                    setErrorModalState(true);
                } else {
                    setErrorMessage(
                        "An unexpected error occurred. Please try again later."
                    );
                    setErrorModalState(true);
                }
            } catch (error) {
                console.error("error with deposit: ", e);
            }
        } else {
            router.push(
                "/newTransactionComplete?id=" +
                    transactionId +
                    "&transaction_type=deposit"
            );
        }
    };

    function satoshisToDollars(satoshis, rateBtcUsdBuy) {
        const btcAmount = satoshis / 100000000; // 1 BTC = 100,000,000 satoshis
        return (btcAmount * rateBtcUsdBuy).toFixed(2)
    }

    const formatRemaining = (ms) => {
        const total = Math.max(0, Math.floor((ms ?? 0) / 1000));
        const m = String(Math.floor(total / 60)).padStart(2, "0");
        const s = String(total % 60).padStart(2, "0");
        return `${m}:${s}`;
    };

    useEffect(() => {
        if (step !== 2 || expired || !expiryEpoch) return;
        const tick = () => {
            const rem = expiryEpoch - Date.now();
            if (rem <= 0) {
                setRemainingMs(0);
                setExpired(true);
                setInvoice("");
            } else {
                setRemainingMs(rem);
            }
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [step, expired, expiryEpoch]);

    useEffect(() => {
        getUser();
    }, []);

    useEffect(() => {
        setMinDepositAmount(user.minDepositUsdt);
    }, [user]);


    return (
        <YStack
            width={"$width100"}
            height={"$height100"}
            alignItems="center"
            alignContent="center"
        >
            <ErrorModal
                message={errorMessage}
                state={errorModalState}
                errorModalOnRequestClose={() => setErrorModalState(false)}
            />
            <YStack padding={"$4"} width={"$width100"}>
                <NewHeaderButton onClick={handleBack}>
                    Deposit Bitcoin
                </NewHeaderButton>
            </YStack>

            {step === 1 ? (
                <YStack
                    height={"$height100"}
                    width={"$width90"}
                    gap={"$3.5"}
                    alignItems="left"
                    alignContent="center"
                >
                    <H6 color={"$neutral13"} textAlign="center">
                        Send SAT via Lightning Network
                    </H6>

                    <Paragraph color={"$neutral12"} weight={"$2"} size={"$3"}>
                        Amount in SATs
                    </Paragraph>
                    <TamaguiInput
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="Enter amount in Satoshis"
                        keyboardType="numeric"
                        error={amountError}
                    />Equivalent in USD: ${satoshisToDollars(amount, user.rateBtcUsdBuy)}
                    <YStack
                        backgroundColor={"$neutral3"}
                        padding={"$4"}
                        borderRadius={"$8"}
                    >
                        <XStack
                            gap={"$2"}
                            justifyContent="flex-start"
                            alignItems="center"
                        >
                            <Image src={WarningIcon} alt="warning_icon" />
                            <Paragraph
                                color={"$neutral11"}
                                weight={"$1"}
                                size={"$4"}
                            >
                                Minimum deposit {minDepositAmount}{" "} USD.
                            </Paragraph>
                        </XStack>
                        <XStack
                            gap={"$2"}
                            justifyContent="flex-start"
                            alignItems="center"
                        >
                            <Image src={WarningIcon} alt="warning_icon" />
                            <Paragraph
                                color={"$neutral11"}
                                weight={"$1"}
                                size={"$4"}
                            >
                                Sender wallet may apply fees.
                            </Paragraph>
                        </XStack>
                        <XStack
                            gap={"$2"}
                            justifyContent="flex-start"
                            alignItems="center"
                        >
                            <Image src={WarningIcon} alt="warning_icon" />
                            <Paragraph
                                color={"$neutral11"}
                                weight={"$1"}
                                size={"$4"}
                            >
                                1 BTC = 100,000,000 SAT
                            </Paragraph>
                        </XStack>
                    </YStack>
                    <TamaguiButton
                        text="Next"
                        onClick={handleContinue}
                        isDisabled={
                        !amount || amountError
                        }
                    />
                </YStack>
            ) : (
                <YStack
                    height={"$height100"}
                    width={"$width90"}
                    gap={"$3.5"}
                    alignItems="center"
                    alignContent="center"
                >
                    <H6 color={"$neutral13"} textAlign="center">
                        Lightning invoice
                    </H6>
                    {expired ? (
                        <XStack
                            padding={"$5"}
                            backgroundColor={"$neutral13"}
                            borderRadius={"$6"}
                        >
                            <YStack
                                width={200}
                                height={200}
                                backgroundColor={"$neutral6"}
                                borderRadius={"$4"}
                            />
                        </XStack>
                    ) : (
                        <XStack
                            padding={"$5"}
                            backgroundColor={"$neutral13"}
                            borderRadius={"$6"}
                        >
                            <QRCode value={invoice} size={200} />
                        </XStack>
                    )}
                    {expired ? (
                        <Paragraph
                            color={"$neutral12"}
                            weight={"$2"}
                            size={"$3"}
                            textAlign="center"
                        >
                            Invoice expired
                        </Paragraph>
                    ) : (
                        <Paragraph
                            color={"$neutral12"}
                            weight={"$1"}
                            size={"$3"}
                            textAlign="center"
                        >
                            Expires in {formatRemaining(remainingMs)}
                            {"\n"}Scan or copy the code below and pay with your lightning wallet.
                        </Paragraph>
                    )}
                    <TamaguiInput
                        value={invoice}
                        editable={false}
                        color={"$neutral12"}
                        icon={expired ? undefined : CopyIcon}
                        onPressIcon={expired ? undefined : handleIconPressed}
                        textAlign="right"
                    />
                    {expired ? (
                        <TamaguiButton
                            text="Generate new invoice"
                            onClick={resetToAmountStep}
                        />
                    ) : (
                        <TamaguiButton text="Checking" isLoading={true}/>
                    )}
                </YStack>
            )}
        </YStack>
    );
}
