"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Paragraph, XStack, YStack } from "tamagui";

import CopyButton from "../CopyButton";
import {
    BreakdownRow,
    Card,
    ErrorText,
    GhostButton,
    Overline,
    assetOf,
    formatAssetAmount,
    mono,
    sans,
    shortenHash,
} from "./primitives";

export const TERMINAL_STATUSES = ["COMPLETED", "EXPIRED", "REFUNDED", "FAILED"];

// Where each status sits on the four-step progress bar. The failure states stay
// at the step they died on; the notice below the stepper explains what happened.
const STEP_INDEX = {
    WAITING_DEPOSIT: 0,
    CONFIRMING: 1,
    SENDING: 2,
    COMPLETED: 3,
    EXPIRED: 0,
    REFUNDING: 2,
    REFUNDED: 3,
    FAILED: 2,
};

const FAILURE_STATUSES = ["EXPIRED", "REFUNDING", "REFUNDED", "FAILED"];

const pad = (value) => String(value).padStart(2, "0");

// Live countdown to `expires_at`. Its own 1s interval, cleaned up on unmount and
// stopped once the swap leaves the waiting state.
function useCountdown(expiresAt, active) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!expiresAt || !active) {
            return undefined;
        }
        setNow(Date.now());
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [expiresAt, active]);

    if (!expiresAt) {
        return null;
    }
    const target = new Date(expiresAt).getTime();
    if (!Number.isFinite(target)) {
        return null;
    }
    const remaining = Math.max(0, Math.floor((target - now) / 1000));
    return {
        remaining,
        text: `${pad(Math.floor(remaining / 60))}:${pad(remaining % 60)}`,
    };
}

function Stepper({ t, status, confirmations, requiredConfirmations }) {
    const current = STEP_INDEX[status] === undefined ? 0 : STEP_INDEX[status];
    const failed = FAILURE_STATUSES.includes(status);
    const labels = [
        t.status.steps.waiting,
        t.status.steps.confirming,
        t.status.steps.sending,
        t.status.steps.done,
    ];

    return (
        <YStack gap={"$2"}>
            <XStack gap={"$1.5"}>
                {labels.map((label, index) => (
                    <YStack
                        key={label}
                        flex={1}
                        height={4}
                        borderRadius={"$10"}
                        backgroundColor={
                            index <= current
                                ? failed
                                    ? "$semanticRed"
                                    : "$pink500"
                                : "$neutral8"
                        }
                    />
                ))}
            </XStack>
            <XStack justifyContent="space-between" gap={"$2"}>
                {labels.map((label, index) => (
                    <Paragraph
                        key={label}
                        color={index <= current ? "$brandOffWhite" : "$neutral10"}
                        style={mono(10, { letterSpacing: "0.08em", textTransform: "uppercase" })}
                    >
                        {label}
                    </Paragraph>
                ))}
            </XStack>
            {status === "CONFIRMING" ? (
                <Paragraph color={"$neutral11"} style={mono(12)}>
                    {t.status.confirmationsProgress(
                        confirmations || 0,
                        requiredConfirmations || 1
                    )}
                </Paragraph>
            ) : null}
        </YStack>
    );
}

// Phase 3: the deposit instructions and the live status of an existing swap.
// Polling happens in pages/swaps; this component only renders what it is given.
export default function SwapStatus({ t, swap, loading, errorText, onNewSwap }) {
    const isWaiting = Boolean(swap) && swap.status === "WAITING_DEPOSIT";
    const countdown = useCountdown(swap && swap.expires_at, isWaiting);

    if (!swap) {
        return (
            <Card>
                <Paragraph color={"$neutral11"} style={sans(13)}>
                    {loading ? t.status.loading : errorText || t.status.notFound}
                </Paragraph>
                <GhostButton onPress={onNewSwap}>{t.status.newSwap}</GhostButton>
            </Card>
        );
    }

    const fromAsset = assetOf(swap.from);
    const statusLabel = t.status.statusLabel[swap.status] || swap.status;
    const notice =
        swap.status === "COMPLETED"
            ? t.status.completedNotice
            : swap.status === "REFUNDING"
              ? t.status.refundNotice
              : swap.status === "REFUNDED"
                ? t.status.refundedNotice
                : swap.status === "EXPIRED"
                  ? t.status.expiredNotice
                  : swap.status === "FAILED"
                    ? t.status.failedNotice
                    : null;

    return (
        <Card>
            <YStack gap={"$2"}>
                <XStack justifyContent="space-between" alignItems="center" gap={"$3"}>
                    <Overline>{t.status.swapId}</Overline>
                    <Paragraph color={"$neutral11"} style={mono(11)}>
                        {shortenHash(swap.swap_id, 8, 6)}
                    </Paragraph>
                </XStack>
                <Paragraph color={"$brandOffWhite"} style={sans(18, { fontWeight: 800 })}>
                    {isWaiting ? t.status.title : statusLabel}
                </Paragraph>
            </YStack>

            <Stepper
                t={t}
                status={swap.status}
                confirmations={swap.confirmations}
                requiredConfirmations={swap.required_confirmations}
            />

            {notice ? (
                <Paragraph
                    color={
                        swap.status === "COMPLETED" ? "$semanticGreen" : "$semanticYellow"
                    }
                    style={sans(13)}
                >
                    {notice}
                </Paragraph>
            ) : null}

            {isWaiting ? (
                <YStack gap={"$3"} alignItems="center">
                    <YStack padding={"$3"} borderRadius={"$5"} backgroundColor={"#FFFFFF"}>
                        <QRCodeSVG
                            value={swap.deposit_address || ""}
                            size={168}
                            aria-label={t.status.qrAlt}
                            title={t.status.qrAlt}
                        />
                    </YStack>

                    <YStack width={"100%"} gap={"$1.5"}>
                        <Overline>{t.status.sendExactly}</Overline>
                        <Paragraph color={"$brandOffWhite"} style={mono(22, { fontWeight: 600 })}>
                            {formatAssetAmount(swap.amount_in_expected, swap.from)}
                        </Paragraph>
                        <Paragraph color={"$neutral11"} style={sans(12)}>
                            {fromAsset ? fromAsset.network : ""}
                        </Paragraph>
                    </YStack>

                    <YStack width={"100%"} gap={"$1.5"}>
                        <Overline>{t.status.depositAddress}</Overline>
                        <XStack
                            alignItems="center"
                            gap={"$2"}
                            padding={"$3"}
                            borderRadius={"$5"}
                            borderWidth={"$1"}
                            borderColor={"$neutral8"}
                            backgroundColor={"$brandSurfaceDeep"}
                        >
                            <Paragraph
                                flex={1}
                                color={"$brandOffWhite"}
                                style={mono(12, { wordBreak: "break-all" })}
                            >
                                {swap.deposit_address}
                            </Paragraph>
                            <CopyButton value={swap.deposit_address} size={"28px"} />
                        </XStack>
                    </YStack>

                    {countdown ? (
                        <XStack
                            width={"100%"}
                            justifyContent="space-between"
                            alignItems="center"
                            gap={"$3"}
                        >
                            <Overline>{t.status.expiresIn}</Overline>
                            <Paragraph
                                color={countdown.remaining > 0 ? "$brandMint" : "$semanticRed"}
                                style={mono(16, { fontWeight: 600 })}
                            >
                                {countdown.remaining > 0 ? countdown.text : t.status.expired}
                            </Paragraph>
                        </XStack>
                    ) : null}
                </YStack>
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
                    value={formatAssetAmount(swap.amount_in_expected, swap.from)}
                />
                <BreakdownRow
                    label={t.status.youReceive}
                    value={formatAssetAmount(swap.amount_out_quoted, swap.to)}
                />
                {swap.deposit_txid ? (
                    <BreakdownRow
                        label={t.status.depositTxid}
                        value={shortenHash(swap.deposit_txid)}
                    />
                ) : null}
                {swap.payout_txid ? (
                    <BreakdownRow
                        label={t.status.payoutTxid}
                        value={shortenHash(swap.payout_txid)}
                    />
                ) : null}
                {swap.refund_txid ? (
                    <BreakdownRow
                        label={t.status.refundTxid}
                        value={shortenHash(swap.refund_txid)}
                    />
                ) : null}
            </YStack>

            {swap.error_note ? <ErrorText>{swap.error_note}</ErrorText> : null}
            {errorText ? <ErrorText>{errorText}</ErrorText> : null}

            <GhostButton onPress={onNewSwap}>{t.status.newSwap}</GhostButton>
        </Card>
    );
}
