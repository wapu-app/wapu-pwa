"use client";
import { Paragraph, XStack, YStack } from "tamagui";

import CalcSelect from "../CalcSelect";
import {
    ASSET_OPTIONS,
    AmountField,
    BreakdownRow,
    Card,
    ErrorText,
    Overline,
    PrimaryButton,
    WarningBanner,
    assetOf,
    displaySymbol,
    formatAssetAmount,
    formatBps,
    formatRate,
    hasUnitToggle,
    mono,
    sans,
} from "./primitives";

// Phase 1: pick the pair, type an amount in *either* field, read the live
// quote. The card is a pure view — the debounced fetch lives in pages/swaps so
// the phases can share one request lifecycle, and so does the BTC/SAT unit.
export default function QuoteCard({
    t,
    from,
    to,
    amount,
    amountOut,
    btcUnit,
    quote,
    loading,
    errorText,
    onFromChange,
    onToChange,
    onAmountChange,
    onAmountOutChange,
    onToggleBtcUnit,
    onSwitch,
    onContinue,
}) {
    const fromAsset = assetOf(from);
    const toAsset = assetOf(to);
    const hasLiquidity = Boolean(quote && quote.liquidity_ok);
    const canContinue = hasLiquidity && !loading;

    const fromUnit = displaySymbol(from, btcUnit);
    const toUnit = displaySymbol(to, btcUnit);
    const unitAria = t.quote.unitAria(btcUnit === "BTC" ? "SAT" : "BTC");

    const amountOutText =
        quote && toAsset ? formatAssetAmount(quote.amount_out, to, { btcUnit }) : "—";
    // The rate is always quoted per whole coin: sats-per-sat would read "1".
    const rateValue = quote ? formatRate(quote.rate, to) : null;
    const rateText =
        rateValue && fromAsset && toAsset
            ? `1 ${fromAsset.symbol} ≈ ${rateValue} ${toAsset.symbol}`
            : "—";
    const minText = quote
        ? formatAssetAmount(quote.min_amount_in, from, { btcUnit })
        : "—";
    const expirationText =
        quote && quote.expiration_minutes
            ? t.quote.minutes(quote.expiration_minutes)
            : "—";
    const confirmationsText =
        quote && quote.required_confirmations !== null && quote.required_confirmations !== undefined
            ? t.quote.confirmationsValue(quote.required_confirmations)
            : "—";

    return (
        <Card>
            {/* You send */}
            <YStack gap={"$2.5"}>
                <XStack justifyContent="space-between" alignItems="center" gap={"$3"}>
                    <Overline>{t.quote.youSend}</Overline>
                    <CalcSelect
                        label={t.quote.youSend}
                        value={from}
                        onChange={onFromChange}
                        options={ASSET_OPTIONS}
                        minWidth={150}
                    />
                </XStack>
                <AmountField
                    value={amount}
                    onChange={onAmountChange}
                    placeholder={"0"}
                    unit={fromUnit}
                    onUnitPress={hasUnitToggle(from) ? onToggleBtcUnit : undefined}
                    unitAriaLabel={unitAria}
                    ariaLabel={t.quote.amountAria}
                    autoFocus
                />
            </YStack>

            {/* Direction switch */}
            <XStack justifyContent="center" alignItems="center" marginVertical={-6}>
                <YStack
                    tag="button"
                    role="button"
                    aria-label={t.quote.switchAria}
                    onPress={onSwitch}
                    width={32}
                    height={32}
                    borderRadius={"$10"}
                    borderWidth={"$1"}
                    borderColor={"$neutral8"}
                    backgroundColor={"$brandSurfaceDeep"}
                    alignItems="center"
                    justifyContent="center"
                    hoverStyle={{ borderColor: "$pink500" }}
                    pressStyle={{ borderColor: "$pink500" }}
                    style={{ cursor: "pointer" }}
                >
                    <Paragraph color={"$brandMint"} style={mono(14, { lineHeight: "14px" })}>
                        ↓
                    </Paragraph>
                </YStack>
            </XStack>

            {/* You get */}
            <YStack gap={"$2.5"}>
                <XStack justifyContent="space-between" alignItems="center" gap={"$3"}>
                    <Overline>{t.quote.youGet}</Overline>
                    <CalcSelect
                        label={t.quote.youGet}
                        value={to}
                        onChange={onToChange}
                        options={ASSET_OPTIONS}
                        minWidth={150}
                    />
                </XStack>
                {/* Editable: typing here asks the backend for the input that
                    pays out exactly this much ("I want to receive 1 BTC"). */}
                <AmountField
                    value={amountOut}
                    onChange={onAmountOutChange}
                    placeholder={"0"}
                    unit={toUnit}
                    onUnitPress={hasUnitToggle(to) ? onToggleBtcUnit : undefined}
                    unitAriaLabel={unitAria}
                    ariaLabel={t.quote.amountOutAria}
                />
            </YStack>

            {loading ? (
                <Paragraph color={"$neutral11"} style={sans(12)}>
                    {t.quote.loading}
                </Paragraph>
            ) : null}

            {errorText ? <ErrorText>{errorText}</ErrorText> : null}

            {quote && !quote.liquidity_ok ? (
                <WarningBanner>{quote.message || t.quote.noLiquidity}</WarningBanner>
            ) : null}

            {/* Breakdown */}
            <YStack
                padding={"$3.5"}
                gap={"$2.5"}
                borderRadius={"$5"}
                borderWidth={"$1"}
                borderColor={"$neutral7"}
                backgroundColor={"$brandSurfaceDeep"}
            >
                <BreakdownRow label={t.quote.youGet} value={amountOutText} />
                <BreakdownRow label={t.quote.rate} value={rateText} />
                <BreakdownRow
                    label={t.quote.fee}
                    value={quote ? formatBps(quote.fee_bps) : "—"}
                />
                <BreakdownRow label={t.quote.minAmount} value={minText} />
                <BreakdownRow label={t.quote.expiration} value={expirationText} />
                <BreakdownRow label={t.quote.confirmations} value={confirmationsText} />
            </YStack>

            {!quote && !loading && !errorText ? (
                <Paragraph color={"$neutral11"} style={sans(12)}>
                    {t.quote.empty}
                </Paragraph>
            ) : null}

            <PrimaryButton onPress={onContinue} disabled={!canContinue}>
                {t.quote.cta}
            </PrimaryButton>
        </Card>
    );
}
