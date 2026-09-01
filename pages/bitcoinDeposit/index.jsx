import { useState, useEffect } from "react";
import { YStack, H6, Paragraph, XStack } from "tamagui";
import { useRouter } from "next/router";
import QRCode from "qrcode.react";
import Image from "next/image";

import ErrorModal from "../../components/ErrorModal";
import TamaguiButton from "../../components/TamaguiButton";
import TamaguiInput from "../../components/TamaguiInput";
import { TamaguiSelect } from "../../components/TamaguiSelect";
import { CurrencySelect } from "../../components/CurrencySelect";
import NewHeaderButton from "../../components/newHeaderButton";

import WarningIcon from "../../public/warning_icon.svg";
import CopyIcon from "../../public/copy_icon.svg";

import {postDeposit, postDepositLightning} from "../../api/api";

import { useUserContext } from "../../context/userContext";
import TamaguiNumpad from "../../components/TamaguiNumpad";
import useAmountNumpad from "../../hooks/useAmountNumpad";
import useTransactionStatus from "../../utils/useTransactionStatus";
import { isValidAmount } from "../../utils/validations";
import {
    convertAmount,
    AMOUNT_UNITS,
    formatAmount,
    formatSats,
    formatUsdt,
} from "../../utils/exchangeCalculator";

const LIGHTNING_INVOICE_FALLBACK_TTL_MS = 15 * 60 * 1000; // used only if the backend timestamps are missing/invalid

// CurrencySelect (the home balance picker) takes { name, id } and reports the
// picked index, so mirror that shape here.
const UNIT_ITEMS = AMOUNT_UNITS.map((unit) => ({ name: unit, id: unit }));

const DEFAULT_UNIT = "ARS";

// SAT is an integer unit, so it gets its own gate; ARS/USD reuse the shared
// 2-decimal validator. This also closes the desktop path, where there is no
// numpad and TamaguiNumpad's allowDecimal cannot help.
const isEditableForUnit = (value, unit) =>
    unit === "SAT" ? /^\d*$/.test(value) : isValidAmount(value);

// Renders a converted amount back into an editable string for `unit`.
// formatAmount trims trailing zeros and stays within the 2 decimals
// isValidAmount accepts, so the result survives a round trip through the input.
const formatForUnit = (converted, unit) => {
    if (unit === "SAT") {
        return String(converted.sat);
    }
    return formatAmount(unit === "ARS" ? converted.ars : converted.usdt);
};

const computeAmountError = (value, unit, rates, minDepositAmount) => {
    if (!value) {
        return false;
    }
    if (unit === "SAT" && !/^[1-9]\d*$/.test(value)) {
        return true;
    }
    const converted = convertAmount(value, unit, rates);
    if (!converted) {
        return Array.isArray(rates) && rates.length > 0;
    }
    const minUsd = parseFloat(minDepositAmount);
    return Number.isFinite(minUsd) && converted.usdt < minUsd;
};

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
    const { numpadAvailable, numpadActive, toggleNumpad } = useAmountNumpad();
    const router = useRouter();
    const { getUser, user } = useUserContext();
    const [step, setStep] = useState(1);
    const [currency, setCurrency] = useState(DEFAULT_UNIT);
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

    useEffect(() => {
        setAmountError(
            computeAmountError(
                amount,
                currency,
                user.rates,
                minDepositAmount
            )
        );
    }, [amount, currency, user.rates, minDepositAmount]);

    const handleAmountChange = (value) => {
        if (!isEditableForUnit(value, currency)) {
            return;
        }
        setAmount(value);
    };

    // The picked unit drives the input from here on. The typed amount is
    // carried across; repeated switches drift by the rounding in each leg.
    const handleUnitChange = (index) => {
        const next = UNIT_ITEMS[index]?.name;
        if (!next || next === currency) {
            return;
        }
        const converted = amount
            ? convertAmount(amount, currency, user.rates)
            : null;
        const nextAmount = converted ? formatForUnit(converted, next) : "";
        setCurrency(next);
        setAmount(nextAmount);
    };

    const handleIconPressed = () => {
        navigator.clipboard.writeText(invoice);
    };

    const resetToAmountStep = () => {
        setStep(1);
        setInvoice("");
        setAmount("");
        setCurrency(DEFAULT_UNIT);
        setAmountError(false);
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
            // The endpoint is denominated in sats. `converted` is the same
            // object the equivalence line renders, so the invoice is always for
            // the figure the user saw. In SAT mode without rates it falls back
            // to the typed integer, which is what this screen sends today.
            const payload = {
                amount: converted ? String(converted.sat) : amount,
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

    // Pure and cheap, so derived on every render — same approach as the price
    // calculator. One call feeds the equivalence line, the error state and the
    // payload, so the three can never disagree.
    const converted = amount
        ? convertAmount(amount, currency, user.rates)
        : null;

    const equivalenceText = !converted
        ? "—"
        : currency === "SAT"
          ? `≈ ${formatUsdt(converted.usdt)} USD · ${formatAmount(
                converted.ars
            )} ARS`
          : `≈ ${formatSats(converted.sat)} SAT`;

    // The minimum is stored in USD; show it in whichever unit is active.
    const minConverted = minDepositAmount
        ? convertAmount(String(minDepositAmount), "USD", user.rates)
        : null;
    const minText =
        minConverted && currency !== "USD"
            ? currency === "SAT"
                ? `${formatSats(minConverted.sat)} SAT`
                : `${formatAmount(minConverted.ars)} ARS`
            : `${minDepositAmount} USD`;

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

                    <XStack
                        justifyContent="space-between"
                        alignItems="center"
                        gap={"$3"}
                    >
                        <Paragraph
                            color={"$neutral12"}
                            weight={"$2"}
                            size={"$3"}
                        >
                            Amount
                        </Paragraph>
                        <CurrencySelect
                            value={currency}
                            onChange={handleUnitChange}
                            items={UNIT_ITEMS}
                        />
                    </XStack>
                    <TamaguiInput
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder={`Enter amount in ${currency}`}
                        keyboardType={
                            currency === "SAT" ? "numeric" : "decimal-pad"
                        }
                        error={amountError}
                        // inputMode is what actually picks the mobile keyboard
                        // on web; keyboardType above is the React Native name
                        // the sibling screens use. "none" still wins so the
                        // custom numpad can suppress the native keyboard.
                        inputMode={
                            numpadActive
                                ? "none"
                                : currency === "SAT"
                                  ? "numeric"
                                  : "decimal"
                        }
                    />
                    <Paragraph color={"$neutral11"} weight={"$1"} size={"$3"}>
                        {equivalenceText}
                    </Paragraph>
                    {numpadAvailable && (
                        <TamaguiNumpad
                            value={amount}
                            onChange={handleAmountChange}
                            enabled={numpadActive}
                            onToggle={toggleNumpad}
                            allowDecimal={currency !== "SAT"}
                        />
                    )}
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
                                Minimum deposit {minText}.
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
                            !amount ||
                            amountError ||
                            (currency !== "SAT" && !converted)
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
