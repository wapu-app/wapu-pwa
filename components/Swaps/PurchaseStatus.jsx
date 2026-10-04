"use client";
import { Paragraph, XStack, YStack } from "tamagui";

import CopyButton from "../CopyButton";
import ArsPaymentInstructions from "./ArsPaymentInstructions";
import { Stepper, TxidRow, useCountdown } from "./SwapStatus";
import {
    BreakdownRow,
    Card,
    ErrorText,
    GhostButton,
    Overline,
    PrimaryButton,
    assetOfPurchase,
    formatArsCents,
    formatAssetAmount,
    mono,
    purchaseAmountToBaseUnits,
    sans,
    shortenHash,
} from "./primitives";

// A direct-fiat tentative is a purchase (ramp-on) by its type/direction, never
// because it merely has a tentative id: crypto -> ARS sales are tentatives too.
export const isPurchaseTentative = (tentative) =>
    Boolean(tentative) &&
    (tentative.type === "crypto_purchase" || tentative.direction === "ramp_on");

// Direct-fiat statuses that read as a swap status on the purchase stepper.
const PURCHASE_STATUS = { FUNDING_ISSUED: "WAITING_DEPOSIT", EXECUTED: "SENDING" };

// Maps a `crypto_purchase` tentative onto the swap-shaped order this component
// and ArsPaymentInstructions render. `amount_ars_cents` is read after funding:
// the backend may bump it a few cents to make the transfer unique.
export function purchaseOrderOf(tentative) {
    const to = assetOfPurchase(tentative.payout_currency, tentative.payout_network);
    return {
        swap_id: tentative.tentative_id,
        status: PURCHASE_STATUS[tentative.status] || tentative.status,
        from: "ARS",
        to,
        amount_in_expected: tentative.amount_ars_cents,
        amount_out_quoted: purchaseAmountToBaseUnits(tentative.amount_out, to),
        amount_out_final: null,
        deposit_address: tentative.alias || null,
        cvu: tentative.cvu || null,
        payout_txid: tentative.txid || null,
        payout_payment_hash: tentative.payment_hash || null,
        expires_at: tentative.expires_at,
        error_code: tentative.payout_status === "review" ? "under_review" : tentative.error_code || null,
        watch_pending: Boolean(tentative.watch_pending),
    };
}

// "Under review", not a failure: the user already paid and an operator reviews it.
// Signalled by `error_code: "under_review"`, or FAILED with a detected deposit.
export const isUnderReview = (swap) =>
    Boolean(swap) &&
    (swap.error_code === "under_review" ||
        (swap.status === "FAILED" && Boolean(swap.deposit_txid)));

function noticeFor(t, swap) {
    if (isUnderReview(swap)) {
        return t.arsPayment.reviewNotice;
    }
    switch (swap.status) {
        case "CONFIRMING":
        case "SENDING":
            return t.arsPayment.sendingNotice;
        case "COMPLETED":
            return t.arsPayment.completedNotice;
        case "EXPIRED":
            return swap.watch_pending ? t.arsPayment.expiredWatchingNotice : t.arsPayment.expiredNotice;
        // Paid in ARS but no crypto went out: never worded as a delivery.
        case "SETTLED_TO_BALANCE":
            return t.arsPayment.settledNotice;
        case "FAILED":
            return t.arsPayment.failedNotice;
        default:
            return null;
    }
}

// Phase 3 of an ARS -> crypto purchase: a legacy swap whose `from` is ARS, or a
// direct-fiat purchase through purchaseOrderOf. Polling lives in pages/swaps;
// this component only renders the order it is given. A purchase still in
// CREATED has no bank instructions yet: `onRetryFunding` issues them again.
export default function PurchaseStatus({
    t,
    lang,
    swap,
    btcUnit,
    errorText,
    showNewSwap,
    onNewSwap,
    onRetryFunding,
    retrying,
}) {
    const isWaiting = swap.status === "WAITING_DEPOSIT";
    const countdown = useCountdown(swap.expires_at, isWaiting);
    const underReview = isUnderReview(swap);
    const title = isWaiting
        ? t.arsPayment.title
        : underReview
          ? t.arsPayment.reviewTitle
          : t.arsPayment.statusLabel[swap.status] || swap.status;
    const notice = noticeFor(t, swap);
    const amountOut =
        swap.amount_out_final !== null && swap.amount_out_final !== undefined
            ? swap.amount_out_final
            : swap.amount_out_quoted;
    const isLightning = swap.to === "BTC_LIGHTNING";

    return (
        <Card>
            <YStack gap={"$2"}>
                <XStack justifyContent="space-between" alignItems="center" gap={"$3"}>
                    <Overline>{t.arsPayment.orderId}</Overline>
                    <XStack alignItems="center" gap={"$1"}>
                        <Paragraph color={"$neutral11"} style={mono(11)}>
                            {shortenHash(swap.swap_id, 8, 6)}
                        </Paragraph>
                        <CopyButton
                            value={swap.swap_id}
                            size={"28px"}
                            copyLabel={t.status.copyAria(t.arsPayment.orderId)}
                            copiedLabel={t.status.copied}
                        />
                    </XStack>
                </XStack>
                <Paragraph color={"$brandOffWhite"} style={sans(18, { fontWeight: 800 })}>
                    {title}
                </Paragraph>
            </YStack>

            <Stepper t={t} status={swap.status} steps={t.arsPayment.steps} showConfirmations={false} />

            {notice ? (
                <Paragraph
                    color={swap.status === "COMPLETED" ? "$semanticGreen" : "$semanticYellow"}
                    style={sans(13)}
                >
                    {notice}
                </Paragraph>
            ) : null}

            {isWaiting ? (
                <ArsPaymentInstructions t={t} lang={lang} swap={swap} countdown={countdown} />
            ) : null}

            {swap.status === "CREATED" && onRetryFunding ? (
                <PrimaryButton onPress={onRetryFunding} disabled={retrying}>
                    {t.fiatPayout.retry}
                </PrimaryButton>
            ) : null}

            <YStack
                padding={"$3.5"}
                gap={"$2.5"}
                borderRadius={"$5"}
                borderWidth={"$1"}
                borderColor={"$neutral7"}
                backgroundColor={"$brandSurfaceDeep"}
            >
                <BreakdownRow
                    label={t.quote.youSend}
                    value={`${formatArsCents(swap.amount_in_expected, lang)} ARS`}
                />
                {/* Settled to balance: no crypto went out, so no crypto amount either. */}
                {swap.status !== "SETTLED_TO_BALANCE" ? (
                    <BreakdownRow
                        label={t.status.youReceive}
                        value={formatAssetAmount(amountOut, swap.to, { btcUnit, network: true })}
                    />
                ) : null}
                {swap.deposit_txid ? (
                    <TxidRow
                        t={t}
                        label={t.arsPayment.paymentRef}
                        txid={swap.deposit_txid}
                        assetCode={swap.from}
                    />
                ) : null}
                {isLightning && swap.payout_payment_hash ? (
                    <TxidRow
                        t={t}
                        label={t.arsPayment.paymentHash}
                        txid={swap.payout_payment_hash}
                        assetCode={swap.to}
                    />
                ) : null}
                {!isLightning && swap.payout_txid ? (
                    <TxidRow
                        t={t}
                        label={t.arsPayment.payoutTxid}
                        txid={swap.payout_txid}
                        assetCode={swap.to}
                    />
                ) : null}
            </YStack>

            {/* No error_note for ARS: `error_code` drives the notice above. */}
            {errorText ? <ErrorText>{errorText}</ErrorText> : null}

            {showNewSwap ? <GhostButton onPress={onNewSwap}>{t.arsPayment.newOrder}</GhostButton> : null}
        </Card>
    );
}
