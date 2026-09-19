"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Anchor, Paragraph, XStack, YStack } from "tamagui";

import CopyButton from "../CopyButton";
import {
    BreakdownRow,
    Card,
    ErrorText,
    GhostButton,
    Overline,
    assetOf,
    explorerTxUrl,
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

// One transaction line in the breakdown. The hash is shown shortened (a full
// txid does not fit a 375px viewport) but both affordances work on the whole
// thing: the text links out to the explorer for the chain the transaction
// settled on, and the button copies the full hash. Looking it up and pasting it
// into a support message are different needs, so neither replaces the other.
// `assetCode` is the leg the hash belongs to, which the caller knows and the
// hash does not carry.
function TxidRow({ t, label, txid, assetCode }) {
    const href = explorerTxUrl(assetCode, txid);
    const short = shortenHash(txid);

    return (
        <XStack justifyContent="space-between" alignItems="center" gap={"$3"}>
            <Paragraph color={"$neutral11"} style={sans(13)}>
                {label}
            </Paragraph>
            <XStack alignItems="center" gap={"$1"}>
                {href ? (
                    <Anchor
                        href={href}
                        target={"_blank"}
                        rel={"noopener noreferrer"}
                        aria-label={t.status.explorerAria(label)}
                        color={"$brandMint"}
                        style={mono(13, { textDecoration: "underline" })}
                    >
                        {short}
                    </Anchor>
                ) : (
                    <Paragraph color={"$brandOffWhite"} style={mono(13)}>
                        {short}
                    </Paragraph>
                )}
                <CopyButton
                    value={txid}
                    size={"28px"}
                    copyLabel={t.status.copyAria(label)}
                    copiedLabel={t.status.copied}
                />
            </XStack>
        </XStack>
    );
}

// Phase 3: the deposit instructions and the live status of an existing swap.
// Polling happens in pages/swaps; this component only renders what it is given.
export default function SwapStatus({ t, swap, btcUnit, loading, errorText, onNewSwap }) {
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
                    {/* Shown shortened, copied whole: this is the id the user
                        quotes back to us to claim a swap that went wrong. */}
                    <XStack alignItems="center" gap={"$1"}>
                        <Paragraph color={"$neutral11"} style={mono(11)}>
                            {shortenHash(swap.swap_id, 8, 6)}
                        </Paragraph>
                        <CopyButton
                            value={swap.swap_id}
                            size={"28px"}
                            copyLabel={t.status.copyAria(t.status.swapId)}
                            copiedLabel={t.status.copied}
                        />
                    </XStack>
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
                            {formatAssetAmount(swap.amount_in_expected, swap.from, { btcUnit })}
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
                            <CopyButton
                                value={swap.deposit_address}
                                size={"28px"}
                                copyLabel={t.status.copyAria(t.status.depositAddress)}
                                copiedLabel={t.status.copied}
                            />
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
                    value={formatAssetAmount(swap.amount_in_expected, swap.from, {
                        btcUnit,
                        network: true,
                    })}
                />
                <BreakdownRow
                    label={t.status.youReceive}
                    value={formatAssetAmount(swap.amount_out_quoted, swap.to, {
                        btcUnit,
                        network: true,
                    })}
                />
                {/* The deposit arrives on the `from` chain and the payout
                    leaves on the `to` one; a refund goes back out the way the
                    deposit came in. */}
                {swap.deposit_txid ? (
                    <TxidRow
                        t={t}
                        label={t.status.depositTxid}
                        txid={swap.deposit_txid}
                        assetCode={swap.from}
                    />
                ) : null}
                {swap.payout_txid ? (
                    <TxidRow
                        t={t}
                        label={t.status.payoutTxid}
                        txid={swap.payout_txid}
                        assetCode={swap.to}
                    />
                ) : null}
                {swap.refund_txid ? (
                    <TxidRow
                        t={t}
                        label={t.status.refundTxid}
                        txid={swap.refund_txid}
                        assetCode={swap.from}
                    />
                ) : null}
            </YStack>

            {swap.error_note ? <ErrorText>{swap.error_note}</ErrorText> : null}
            {errorText ? <ErrorText>{errorText}</ErrorText> : null}

            <GhostButton onPress={onNewSwap}>{t.status.newSwap}</GhostButton>
        </Card>
    );
}
