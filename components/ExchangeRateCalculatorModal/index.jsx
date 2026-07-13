"use client";
import { useState } from "react";
import { YStack, XStack, Paragraph, Input, Dialog } from "tamagui";
import CloseIcon from "../../public/icons/close_black.svg";
import TamaguiIconButton from "../TamaguiIconButton";
import CalcSelect from "../CalcSelect";
import { useUserContext } from "../../context/userContext";
import { isValidAmount } from "../../utils/validations";
import { GEIST, GEIST_MONO } from "../../utils/fonts";
import {
    estimateFromFiat,
    estimateFromDeposit,
    getFiatOptionsForCrypto,
    formatAmount,
    formatUsdt,
    formatSats,
    satsToBtc,
} from "../../utils/exchangeCalculator";

const DEFAULT_CRYPTO = "USDT";
const DEFAULT_FIAT = "ARS";

// Select options are constant (crypto/speed) or per-crypto (fiat), so build them
// once at module scope instead of re-allocating on every render.
const toOptions = (values) => values.map((v) => ({ value: v, label: v }));
const CRYPTO_SELECT_OPTIONS = toOptions(["USDT", "BTC"]);
const FIAT_SELECT_OPTIONS = {
    USDT: toOptions(getFiatOptionsForCrypto("USDT")),
    BTC: toOptions(getFiatOptionsForCrypto("BTC")),
};
const SPEED_OPTIONS = [
    { value: false, label: "Fiat transfer" },
    { value: true, label: "Fast fiat transfer" },
];

// Brand mono style objects only vary by size/weight; share the family.
const mono = (fontSize, extra) => ({ fontFamily: GEIST_MONO, fontSize, ...extra });

// Mono uppercase overline (manual: "Overline — Geist Mono · 600 · 0.14em").
function Overline({ children, color = "$neutral11", size = 11 }) {
    return (
        <Paragraph
            color={color}
            style={{
                fontFamily: GEIST_MONO,
                fontWeight: 600,
                fontSize: size,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
            }}
        >
            {children}
        </Paragraph>
    );
}

// A deposit/cover amount field: large mono number, border turns pink on focus, unit pinned right.
function AmountField({ value, onChange, placeholder, unit, autoFocus, ariaLabel }) {
    const [focus, setFocus] = useState(false);
    return (
        <XStack
            alignItems="center"
            gap={"$2"}
            height={58}
            paddingHorizontal={"$3.5"}
            backgroundColor={"$brandSurfaceDeep"}
            borderWidth={"$1"}
            borderColor={focus ? "$pink500" : "$neutral8"}
            borderRadius={"$5"}
        >
            <Input
                flex={1}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                placeholder={placeholder}
                autoFocus={autoFocus}
                aria-label={ariaLabel}
                inputMode={"decimal"}
                backgroundColor={"transparent"}
                color={"$brandOffWhite"}
                placeholderTextColor={"$neutral9"}
                borderWidth={0}
                outlineWidth={0}
                paddingHorizontal={0}
                focusVisibleStyle={{ outlineWidth: 0 }}
                style={mono(24, { fontWeight: 500 })}
            />
            {unit ? (
                <Paragraph color={"$neutral10"} style={mono(14)}>
                    {unit}
                </Paragraph>
            ) : null}
        </XStack>
    );
}

// One line of the breakdown card: muted label left, mono value right.
function BreakdownRow({ label, value }) {
    return (
        <XStack justifyContent="space-between" alignItems="center" gap={"$3"}>
            <Paragraph color={"$neutral11"} style={{ fontFamily: GEIST, fontSize: 13 }}>
                {label}
            </Paragraph>
            <Paragraph color={"$brandOffWhite"} style={mono(13)} textAlign="right">
                {value}
            </Paragraph>
        </XStack>
    );
}

export default function ExchangeRateCalculatorModal({ isOpen, onClose }) {
    const { user } = useUserContext();
    const [cryptoCurrency, setCryptoCurrency] = useState(DEFAULT_CRYPTO);
    const [fiatCurrency, setFiatCurrency] = useState(DEFAULT_FIAT);
    const [isFast, setIsFast] = useState(false);

    // `driver` tracks which field the user last typed, so we recompute the other from it.
    const [fiatInput, setFiatInput] = useState("");
    const [depositInput, setDepositInput] = useState("");
    const [driver, setDriver] = useState("fiat");

    const feeFraction = isFast
        ? user.fastFiatTransferFee
        : user.fiatTransferFee;

    const isBtc = cryptoCurrency === "BTC";

    // Pure + cheap, so derived on every render — no useEffect / debounce needed.
    const quoteArgs = { rates: user.rates, cryptoCurrency, fiatCurrency, feeFraction };
    const estimate =
        driver === "deposit"
            ? estimateFromDeposit({ depositAmount: depositInput, ...quoteArgs })
            : estimateFromFiat({ fiatAmount: fiatInput, ...quoteArgs });

    const depositFromEstimate = () => {
        if (!estimate) {
            return "";
        }
        return isBtc
            ? String(estimate.fundingSat)
            : formatAmount(estimate.fundingUsdt);
    };

    const fiatFieldValue =
        driver === "fiat"
            ? fiatInput
            : estimate
            ? formatAmount(estimate.fiatAmount)
            : "";
    const depositFieldValue =
        driver === "deposit" ? depositInput : depositFromEstimate();

    const resetState = () => {
        setFiatInput("");
        setDepositInput("");
        setCryptoCurrency(DEFAULT_CRYPTO);
        setFiatCurrency(DEFAULT_FIAT);
        setIsFast(false);
        setDriver("fiat");
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFiatAmountChange = (value) => {
        if (isValidAmount(value)) {
            setFiatInput(value);
            setDriver("fiat");
        }
    };

    const handleDepositChange = (value) => {
        if (isValidAmount(value)) {
            setDepositInput(value);
            setDriver("deposit");
        }
    };

    // Control changes make "fiat" the driver again, preserving its current value.
    const ensureFiatDriver = () => {
        if (driver !== "fiat") {
            setFiatInput(fiatFieldValue);
            setDriver("fiat");
        }
    };

    const handleCryptoCurrencyChange = (nextCrypto) => {
        ensureFiatDriver();
        setCryptoCurrency(nextCrypto);
        const validFiats = getFiatOptionsForCrypto(nextCrypto);
        if (!validFiats.includes(fiatCurrency)) {
            setFiatCurrency(validFiats[0]);
        }
    };

    const handleFiatCurrencyChange = (nextFiat) => {
        ensureFiatDriver();
        setFiatCurrency(nextFiat);
    };

    const depositUnit = isBtc ? "sats" : "USDT";
    const rateText = estimate
        ? `1 USDT = ${formatAmount(estimate.exchangeRate)} ${fiatCurrency}`
        : "—";
    const feeText = estimate ? `≈ ${formatUsdt(estimate.feeUsdt)} USDT` : "—";

    return (
        <Dialog
            modal
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    handleClose();
                }
            }}
        >
            <Dialog.Portal>
                <Dialog.Overlay
                    key="overlay"
                    animation="slow"
                    opacity={0.9}
                    enterStyle={{ opacity: 0 }}
                    exitStyle={{ opacity: 0 }}
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.9)", zIndex: 10 }}
                />
                <Dialog.Content
                    key="content"
                    animation={[
                        "quicker",
                        { opacity: { overshootClamping: true } },
                    ]}
                    enterStyle={{ opacity: 0, y: 12 }}
                    exitStyle={{ opacity: 0, y: 12 }}
                    width={"100%"}
                    height={"100%"}
                    maxWidth={"100%"}
                    margin={0}
                    padding={0}
                    borderWidth={0}
                    borderRadius={0}
                    backgroundColor={"$brandInk"}
                    overflow={"hidden"}
                >
                    {/* Reactive glow (brand "glow reactivo"), low-opacity and behind content. */}
                    <YStack
                        position="absolute"
                        top={-120}
                        right={-100}
                        width={360}
                        height={360}
                        style={{
                            background:
                                "radial-gradient(circle, rgba(231,53,124,0.22) 0%, rgba(115,9,182,0.12) 42%, rgba(10,7,18,0) 70%)",
                            pointerEvents: "none",
                        }}
                    />
                    <YStack
                        position="absolute"
                        bottom={-140}
                        left={-120}
                        width={340}
                        height={340}
                        style={{
                            background:
                                "radial-gradient(circle, rgba(124,255,216,0.08) 0%, rgba(10,7,18,0) 68%)",
                            pointerEvents: "none",
                        }}
                    />

                    <YStack
                        flex={1}
                        width={"$width100"}
                        paddingHorizontal={"$5"}
                        paddingTop={"$8"}
                        paddingBottom={"$5"}
                        gap={"$5"}
                    >
                        {/* Header */}
                        <XStack
                            justifyContent="space-between"
                            alignItems="flex-start"
                            gap={"$3"}
                        >
                            <YStack flex={1} gap={"$2.5"}>
                                <XStack
                                    alignSelf="flex-start"
                                    alignItems="center"
                                    gap={"$2"}
                                    paddingVertical={"$1.5"}
                                    paddingHorizontal={"$2.5"}
                                    borderRadius={"$8"}
                                    borderWidth={"$1"}
                                    borderColor={"$neutral8"}
                                    backgroundColor={"$brandSurfaceDeep"}
                                >
                                    <YStack
                                        width={7}
                                        height={7}
                                        borderRadius={"$10"}
                                        backgroundColor={"$brandMint"}
                                    />
                                    <Overline color={"$neutral11"}>
                                        Price calculator
                                    </Overline>
                                </XStack>
                                <Dialog.Title
                                    color={"$brandOffWhite"}
                                    style={{
                                        fontFamily: GEIST,
                                        fontWeight: 800,
                                        fontSize: 26,
                                        lineHeight: "30px",
                                    }}
                                >
                                    Estimate a transaction
                                </Dialog.Title>
                                <Dialog.Description
                                    color={"$neutral11"}
                                    style={{
                                        fontFamily: GEIST,
                                        fontSize: 13,
                                        lineHeight: "18px",
                                    }}
                                >
                                    Rate and final amount are confirmed when you
                                    create the transaction.
                                </Dialog.Description>
                            </YStack>
                            <YStack
                                alignSelf="flex-start"
                                padding={"$1.5"}
                                borderRadius={"$9"}
                                borderWidth={"$0.75"}
                                borderColor={"$pink700"}
                                backgroundColor={"rgba(231, 53, 124, 0.16)"}
                            >
                                <TamaguiIconButton
                                    onClick={handleClose}
                                    icon={CloseIcon}
                                    size={"26px"}
                                />
                            </YStack>
                        </XStack>

                        {/* You deposit */}
                        <YStack gap={"$2.5"}>
                            <XStack
                                justifyContent="space-between"
                                alignItems="center"
                                gap={"$3"}
                            >
                                <Overline>You deposit</Overline>
                                <CalcSelect
                                    label="Funding currency"
                                    value={cryptoCurrency}
                                    onChange={handleCryptoCurrencyChange}
                                    options={CRYPTO_SELECT_OPTIONS}
                                />
                            </XStack>
                            <AmountField
                                value={depositFieldValue}
                                onChange={handleDepositChange}
                                placeholder={"0"}
                                unit={depositUnit}
                                ariaLabel={`Deposit amount in ${depositUnit}`}
                            />
                            {isBtc && estimate ? (
                                <Paragraph color={"$neutral11"} style={mono(12)}>
                                    {`≈ ${satsToBtc(
                                        parseFloat(depositFieldValue)
                                    )} BTC · ${formatUsdt(
                                        estimate.fundingUsdt
                                    )} USDT`}
                                </Paragraph>
                            ) : null}
                        </YStack>

                        {/* Connector — subtle "rayo/step" accent */}
                        <XStack
                            justifyContent="center"
                            alignItems="center"
                            marginVertical={-8}
                        >
                            <YStack
                                width={30}
                                height={30}
                                borderRadius={"$10"}
                                borderWidth={"$1"}
                                borderColor={"$neutral8"}
                                backgroundColor={"$brandSurface"}
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Paragraph
                                    color={"$brandMint"}
                                    style={mono(14, { lineHeight: "14px" })}
                                >
                                    ↓
                                </Paragraph>
                            </YStack>
                        </XStack>

                        {/* To cover */}
                        <YStack gap={"$2.5"}>
                            <XStack
                                justifyContent="space-between"
                                alignItems="center"
                                gap={"$3"}
                            >
                                <Overline>To cover</Overline>
                                <CalcSelect
                                    label="Destination currency"
                                    value={fiatCurrency}
                                    onChange={handleFiatCurrencyChange}
                                    options={FIAT_SELECT_OPTIONS[cryptoCurrency]}
                                />
                            </XStack>
                            <AmountField
                                value={fiatFieldValue}
                                onChange={handleFiatAmountChange}
                                placeholder={"0.00"}
                                unit={fiatCurrency}
                                autoFocus
                                ariaLabel={`Amount to cover in ${fiatCurrency}`}
                            />
                        </YStack>

                        {/* Transfer speed */}
                        <XStack
                            justifyContent="space-between"
                            alignItems="center"
                            gap={"$3"}
                        >
                            <Overline>Transfer speed</Overline>
                            <CalcSelect
                                label="Transfer speed"
                                minWidth={168}
                                value={isFast}
                                onChange={setIsFast}
                                options={SPEED_OPTIONS}
                            />
                        </XStack>

                        {/* Breakdown */}
                        <YStack
                            marginTop={"$2"}
                            padding={"$4"}
                            gap={"$3"}
                            borderRadius={"$6"}
                            borderWidth={"$1"}
                            borderColor={"$neutral7"}
                            backgroundColor={"$brandSurface"}
                        >
                            <BreakdownRow
                                label="Exchange rate"
                                value={rateText}
                            />
                            <BreakdownRow
                                label={
                                    isFast
                                        ? "Fast fiat transfer fee"
                                        : "Fiat transfer fee"
                                }
                                value={feeText}
                            />

                            <YStack
                                height={1}
                                backgroundColor={"$neutral7"}
                                marginVertical={"$1"}
                            />

                            <XStack
                                justifyContent="space-between"
                                alignItems="flex-start"
                                gap={"$3"}
                            >
                                <Overline size={12}>Total required</Overline>
                                <YStack alignItems="flex-end" gap={"$1"}>
                                    <Paragraph
                                        color={"$brandOffWhite"}
                                        style={mono(20, { fontWeight: 600 })}
                                        textAlign="right"
                                    >
                                        {!estimate
                                            ? "—"
                                            : isBtc
                                            ? `${formatSats(
                                                  estimate.totalSat
                                              )} sats`
                                            : `${formatUsdt(
                                                  estimate.totalUsdt
                                              )} USDT`}
                                    </Paragraph>
                                    {isBtc && estimate ? (
                                        <Paragraph
                                            color={"$neutral11"}
                                            style={mono(12)}
                                            textAlign="right"
                                        >
                                            {`≈ ${formatUsdt(
                                                estimate.totalUsdt
                                            )} USDT`}
                                        </Paragraph>
                                    ) : null}
                                </YStack>
                            </XStack>
                        </YStack>
                    </YStack>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog>
    );
}
