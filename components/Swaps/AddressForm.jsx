"use client";
import { useState } from "react";
import { Paragraph, YStack } from "tamagui";

import {
    BreakdownRow,
    Card,
    ErrorText,
    GhostButton,
    Overline,
    PrimaryButton,
    TextField,
    assetOf,
    formatAssetAmount,
    formatBps,
    isValidAddressFor,
    sans,
} from "./primitives";

// Phase 2: collect the payout address (on the `to` network) and the refund
// address (on the `from` network). An ARS purchase (`flow="arsBuy"`) has no
// refund address: pesos are never refunded on-chain, an operator handles it. Validation runs on submit and then live on
// every keystroke of a field the user already got wrong, so the error clears as
// soon as the address becomes plausible.
export default function AddressForm({
    t,
    lang,
    flow = "swap",
    from,
    to,
    btcUnit,
    quote,
    payoutAddress,
    refundAddress,
    onPayoutChange,
    onRefundChange,
    onBack,
    onSubmit,
    submitting,
    submitError,
}) {
    const [touched, setTouched] = useState(false);
    const fromAsset = assetOf(from);
    const toAsset = assetOf(to);

    const isArsBuy = flow === "arsBuy";
    const isLightningPayout = toAsset && toAsset.family === "lightning";

    const errorFor = (assetCode, value) => {
        if (!String(value || "").trim()) {
            return t.addresses.required;
        }
        if (!isValidAddressFor(assetCode, value)) {
            const asset = assetOf(assetCode);
            if (asset && asset.family === "lightning") {
                return t.arsBuyAddress.invalidLightning;
            }
            return t.addresses.invalid(asset ? asset.network : assetCode);
        }
        return null;
    };

    const payoutError = errorFor(to, payoutAddress);
    const refundError = isArsBuy ? null : errorFor(from, refundAddress);
    const isValid = !payoutError && !refundError;

    const handleSubmit = () => {
        setTouched(true);
        if (!isValid || submitting) {
            return;
        }
        onSubmit();
    };

    return (
        <Card>
            <YStack gap={"$2"}>
                <Paragraph color={"$brandOffWhite"} style={sans(18, { fontWeight: 800 })}>
                    {t.addresses.title}
                </Paragraph>
                <Paragraph color={"$neutral11"} style={sans(13)}>
                    {isArsBuy ? t.arsBuyAddress.subtitle : t.addresses.subtitle}
                </Paragraph>
            </YStack>

            <YStack gap={"$2"}>
                <Overline>
                    {t.addresses.payoutLabel(
                        toAsset ? toAsset.symbol : to,
                        toAsset ? toAsset.network : ""
                    )}
                </Overline>
                <TextField
                    value={payoutAddress}
                    onChange={onPayoutChange}
                    placeholder={
                        isLightningPayout
                            ? t.arsBuyAddress.lightningPlaceholder
                            : t.addresses.payoutPlaceholder
                    }
                    ariaLabel={t.addresses.payoutLabel(
                        toAsset ? toAsset.symbol : to,
                        toAsset ? toAsset.network : ""
                    )}
                    invalid={touched && Boolean(payoutError)}
                />
                {touched && payoutError ? <ErrorText>{payoutError}</ErrorText> : null}
            </YStack>

            {isArsBuy ? null : (
            <YStack gap={"$2"}>
                <Overline>
                    {t.addresses.refundLabel(
                        fromAsset ? fromAsset.symbol : from,
                        fromAsset ? fromAsset.network : ""
                    )}
                </Overline>
                <TextField
                    value={refundAddress}
                    onChange={onRefundChange}
                    placeholder={t.addresses.refundPlaceholder}
                    ariaLabel={t.addresses.refundLabel(
                        fromAsset ? fromAsset.symbol : from,
                        fromAsset ? fromAsset.network : ""
                    )}
                    invalid={touched && Boolean(refundError)}
                />
                {touched && refundError ? (
                    <ErrorText>{refundError}</ErrorText>
                ) : (
                    <Paragraph color={"$neutral11"} style={sans(12)}>
                        {t.addresses.refundHelp}
                    </Paragraph>
                )}
            </YStack>
            )}

            {quote ? (
                <YStack
                    padding={"$3.5"}
                    gap={"$2.5"}
                    borderRadius={"$5"}
                    borderWidth={"$1"}
                    borderColor={"$neutral7"}
                    backgroundColor={"$brandSurfaceDeep"}
                >
                    <Overline>{t.addresses.summary}</Overline>
                    <BreakdownRow
                        label={t.quote.youSend}
                        value={`${isArsBuy ? "≈ " : ""}${formatAssetAmount(quote.amount_in, from, {
                            btcUnit,
                            lang,
                            network: true,
                        })}`}
                    />
                    <BreakdownRow
                        label={t.quote.youGet}
                        value={formatAssetAmount(quote.amount_out, to, {
                            btcUnit,
                            network: true,
                        })}
                    />
                    <BreakdownRow label={t.quote.fee} value={formatBps(quote.fee_bps)} />
                    {/* The order adds the fee delta and identifying cents: the
                        exact amount to transfer only exists once it is created. */}
                    {isArsBuy ? (
                        <Paragraph color={"$neutral11"} style={sans(12)}>
                            {t.arsBuyAddress.finalAmountHint}
                        </Paragraph>
                    ) : null}
                </YStack>
            ) : null}

            {submitError ? <ErrorText>{submitError}</ErrorText> : null}

            <YStack gap={"$2.5"}>
                <PrimaryButton onPress={handleSubmit} disabled={submitting}>
                    {isArsBuy
                        ? submitting
                            ? t.arsBuyAddress.submitting
                            : t.arsBuyAddress.submit
                        : submitting
                          ? t.addresses.submitting
                          : t.addresses.submit}
                </PrimaryButton>
                <GhostButton onPress={onBack}>{t.addresses.back}</GhostButton>
            </YStack>
        </Card>
    );
}
