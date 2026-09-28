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
    formatArsCents,
    formatAssetAmount,
    mono,
    sans,
    shortenHash,
} from "./primitives";

// "Under review", not a plain failure: the user already paid and an operator
// reviews it (the backend never refunds ARS on its own). The backend says so
// with `error_code: "under_review"`; FAILED with a detected deposit is kept as
// a fallback rule for the same case.
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
            return t.arsPayment.expiredNotice;
        case "FAILED":
            return t.arsPayment.failedNotice;
        default:
            return null;
    }
}

// Phase 3 of an ARS -> crypto purchase (a swap whose `from` is ARS). Polling
// lives in pages/swaps; this component only renders the swap it is given.
export default function PurchaseStatus({ t, lang, swap, btcUnit, errorText, onNewSwap }) {
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
                <BreakdownRow
                    label={t.status.youReceive}
                    value={formatAssetAmount(amountOut, swap.to, { btcUnit, network: true })}
                />
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

            {/* error_note is never shown for ARS (the backend sends it null;
                `error_code` drives the notice above). */}
            {errorText ? <ErrorText>{errorText}</ErrorText> : null}

            <GhostButton onPress={onNewSwap}>{t.arsPayment.newOrder}</GhostButton>
        </Card>
    );
}
