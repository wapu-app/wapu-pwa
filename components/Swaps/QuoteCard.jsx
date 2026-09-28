"use client";
import { Paragraph, XStack, YStack } from "tamagui";

import CalcSelect from "../CalcSelect";
import {
    AmountField,
    BreakdownRow,
    Card,
    ErrorText,
    Overline,
    PrimaryButton,
    WarningBanner,
    assetOf,
    directFiatDepositBaseUnits,
    displaySymbol,
    effectiveRate,
    formatAssetAmount,
    formatBps,
    formatRate,
    hasUnitToggle,
    mono,
    sans,
    toBaseUnits,
} from "./primitives";

// Breakdown rows for a crypto -> ARS order. Its quote is the direct-fiat one
// (amounts in pesos and dollars), not a swap quote.
function ArsSellBreakdown({ t, lang, from, quote, btcUnit }) {
    const deposit = quote ? directFiatDepositBaseUnits(quote, from) : null;
    return (
        <>
            <BreakdownRow
                label={t.quote.youSend}
                value={quote ? formatAssetAmount(deposit, from, { btcUnit }) : "—"}
            />
            <BreakdownRow
                label={t.arsQuote.sellRate}
                value={
                    quote && quote.usdt_ars_rate !== undefined
                        ? formatAssetAmount(Math.round(Number(quote.usdt_ars_rate) * 100), "ARS", {
                              lang,
                          })
                        : "—"
                }
            />
            <BreakdownRow
                label={t.arsQuote.sellFee}
                value={
                    quote && quote.fee_amount_usdt !== undefined
                        ? `${quote.fee_amount_usdt} USDT`
                        : "—"
                }
            />
        </>
    );
}

// Phase 1: pick the pair, type an amount in *either* field, read the live
// quote. The card is a pure view — the debounced fetch lives in pages/swaps so
// the phases can share one request lifecycle, and so does the BTC/SAT unit.
// `flow` is "swap", "arsBuy" or "arsSell" (see flowOf in primitives). In
// "arsSell" the direct-fiat quote only prices from the ARS amount, so "you
// send" is read-only there.
export default function QuoteCard({
    t,
    lang,
    flow = "swap",
    sendOptions,
    receiveOptions,
    canSwitch = true,
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
    const isArsSell = flow === "arsSell";
    const isArsBuy = flow === "arsBuy";
    // The direct-fiat quote has no liquidity flag: a 200 is the go-ahead.
    const hasLiquidity = Boolean(quote && (isArsSell || quote.liquidity_ok));
    const canContinue = hasLiquidity && !loading;

    const fromUnit = displaySymbol(from, btcUnit);
    const toUnit = displaySymbol(to, btcUnit);
    const unitAria = t.quote.unitAria(btcUnit === "BTC" ? "SAT" : "BTC");

    const amountOutText =
        quote && toAsset ? formatAssetAmount(quote.amount_out, to, { btcUnit, lang }) : "—";
    // Per whole coin (sats-per-sat would read "1"), all-in, and with the
    // unambiguous tickers so an L-BTC/BTC pair does not read "1 BTC ≈ 1 BTC".
    // Buying with pesos reads the other way round ("1 BTC ≈ 150000000 ARS"):
    // a price in fractions of a bitcoin per peso means nothing to anyone.
    const rateValue = !quote
        ? null
        : isArsBuy
          ? formatRate(effectiveRate(quote.amount_out, quote.amount_in, to, from), from)
          : formatRate(effectiveRate(quote.amount_in, quote.amount_out, from, to), to);
    const rateText =
        rateValue && fromAsset && toAsset
            ? isArsBuy
                ? `1 ${toAsset.ticker} ≈ ${formatAssetAmount(toBaseUnits(rateValue, 2), from, { lang })}`
                : `1 ${fromAsset.ticker} ≈ ${rateValue} ${toAsset.ticker}`
            : "—";
    const minText = quote
        ? formatAssetAmount(quote.min_amount_in, from, { btcUnit, lang })
        : "—";
    const lnFee = quote && quote.fee_estimate_sats;
    const lnFeeText =
        lnFee !== null && lnFee !== undefined ? t.arsQuote.lnFeeValue(lnFee) : null;
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
                        options={sendOptions}
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
                    readOnly={isArsSell}
                    autoFocus={!isArsSell}
                />
            </YStack>

            {/* Direction switch */}
            <XStack justifyContent="center" alignItems="center" marginVertical={-6}>
                <YStack
                    tag="button"
                    role="button"
                    aria-label={t.quote.switchAria}
                    aria-disabled={!canSwitch}
                    disabled={!canSwitch}
                    onPress={canSwitch ? onSwitch : undefined}
                    opacity={canSwitch ? 1 : 0.35}
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
                        options={receiveOptions}
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
                    autoFocus={isArsSell}
                />
                {isArsSell ? (
                    <Paragraph color={"$neutral11"} style={sans(12)}>
                        {t.arsQuote.sellInputHint}
                    </Paragraph>
                ) : null}
            </YStack>

            {loading ? (
                <Paragraph color={"$neutral11"} style={sans(12)}>
                    {t.quote.loading}
                </Paragraph>
            ) : null}

            {errorText ? <ErrorText>{errorText}</ErrorText> : null}

            {quote && !isArsSell && !quote.liquidity_ok ? (
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
                {isArsSell ? (
                    <ArsSellBreakdown
                        t={t}
                        lang={lang}
                        from={from}
                        quote={quote}
                        btcUnit={btcUnit}
                    />
                ) : (
                    <>
                        <BreakdownRow label={t.quote.youGet} value={amountOutText} />
                        <BreakdownRow label={t.quote.rate} value={rateText} />
                        <BreakdownRow
                            label={t.quote.fee}
                            value={quote ? formatBps(quote.fee_bps) : "—"}
                        />
                        {isArsBuy && lnFeeText ? (
                            <BreakdownRow label={t.arsQuote.lnFee} value={lnFeeText} />
                        ) : null}
                        <BreakdownRow label={t.quote.minAmount} value={minText} />
                        <BreakdownRow label={t.quote.expiration} value={expirationText} />
                        {/* A bank transfer has no confirmations to wait for. */}
                        {isArsBuy ? null : (
                            <BreakdownRow
                                label={t.quote.confirmations}
                                value={confirmationsText}
                            />
                        )}
                    </>
                )}
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
