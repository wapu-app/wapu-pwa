"use client";
import { QRCodeSVG } from "qrcode.react";
import { Paragraph, XStack, YStack } from "tamagui";

import CopyButton from "../CopyButton";
import { useCountdown } from "./SwapStatus";
import {
    BreakdownRow,
    Card,
    ErrorText,
    GhostButton,
    Overline,
    PrimaryButton,
    assetOfFunding,
    directFiatDepositBaseUnits,
    formatArsCents,
    formatAssetAmount,
    mono,
    sans,
    shortenHash,
} from "./primitives";

// Direct-fiat tentative statuses (not swap statuses). EXECUTED is not final:
// the fiat transfer is still going out.
export const TENTATIVE_TERMINAL_STATUSES = [
    "COMPLETED",
    "EXPIRED",
    "SETTLED_TO_BALANCE",
    "FAILED",
    "REFUNDED",
];

function noticeFor(t, status) {
    switch (status) {
        case "EXECUTED":
            return t.fiatPayout.executedNotice;
        case "COMPLETED":
            return t.fiatPayout.completedNotice;
        case "EXPIRED":
            return t.fiatPayout.expiredNotice;
        case "SETTLED_TO_BALANCE":
            return t.fiatPayout.settledNotice;
        case "FAILED":
            return t.fiatPayout.failedNotice;
        case "PROCESSING_REFUND":
            return t.fiatPayout.refundNotice;
        case "REFUNDED":
            return t.fiatPayout.refundedNotice;
        default:
            return null;
    }
}

// One copyable value (invoice, address, asset id) in a bordered box.
function CopyBox({ t, label, value }) {
    return (
        <YStack width={"100%"} gap={"$1.5"}>
            <Overline>{label}</Overline>
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
                    {value}
                </Paragraph>
                <CopyButton
                    value={value}
                    size={"28px"}
                    copyLabel={t.status.copyAria(label)}
                    copiedLabel={t.status.copied}
                />
            </XStack>
        </YStack>
    );
}

// Phase 3 of a crypto -> ARS order. The tentative is read from
// GET /transactions/direct-fiat/tentatives/<id>; polling lives in pages/swaps.
// A tentative still in CREATED has no deposit instructions yet (the /funding
// call failed or has not run): `onRetryFunding` issues them again, which is
// idempotent on the backend.
export default function FiatPayoutStatus({
    t,
    lang,
    tentative,
    btcUnit,
    loading,
    errorText,
    onRetryFunding,
    retrying,
    onNewSwap,
}) {
    const isWaiting = Boolean(tentative) && tentative.status === "FUNDING_ISSUED";
    const countdown = useCountdown(tentative && tentative.expires_at, isWaiting);

    if (!tentative) {
        return (
            <Card>
                <Paragraph color={"$neutral11"} style={sans(13)}>
                    {loading ? t.status.loading : errorText || t.status.notFound}
                </Paragraph>
                <GhostButton onPress={onNewSwap}>{t.arsPayment.newOrder}</GhostButton>
            </Card>
        );
    }

    const assetCode = assetOfFunding(tentative.funding_currency, tentative.funding_network);
    const depositAmount = directFiatDepositBaseUnits(tentative, assetCode);
    const depositText = assetCode
        ? formatAssetAmount(depositAmount, assetCode, { btcUnit, network: true })
        : "—";
    const destination = tentative.lightning_pr || tentative.address_destination || null;
    const destinationLabel = tentative.lightning_pr ? t.fiatPayout.invoice : t.fiatPayout.address;
    const arsCents = Math.round(Number(tentative.amount_ars) * 100);
    const notice = noticeFor(t, tentative.status);

    return (
        <Card>
            <YStack gap={"$2"}>
                <XStack justifyContent="space-between" alignItems="center" gap={"$3"}>
                    <Overline>{t.fiatPayout.orderId}</Overline>
                    <XStack alignItems="center" gap={"$1"}>
                        <Paragraph color={"$neutral11"} style={mono(11)}>
                            {shortenHash(tentative.tentative_id, 8, 6)}
                        </Paragraph>
                        <CopyButton
                            value={tentative.tentative_id}
                            size={"28px"}
                            copyLabel={t.status.copyAria(t.fiatPayout.orderId)}
                            copiedLabel={t.status.copied}
                        />
                    </XStack>
                </XStack>
                <Paragraph color={"$brandOffWhite"} style={sans(18, { fontWeight: 800 })}>
                    {isWaiting
                        ? t.fiatPayout.title
                        : t.fiatPayout.statusLabel[tentative.status] || tentative.status}
                </Paragraph>
            </YStack>

            {notice ? (
                <Paragraph
                    color={tentative.status === "COMPLETED" ? "$semanticGreen" : "$semanticYellow"}
                    style={sans(13)}
                >
                    {notice}
                </Paragraph>
            ) : null}

            {isWaiting && destination ? (
                <YStack gap={"$3"} alignItems="center">
                    <YStack padding={"$3"} borderRadius={"$5"} backgroundColor={"#FFFFFF"}>
                        <QRCodeSVG
                            value={destination}
                            size={168}
                            aria-label={t.fiatPayout.qrAlt}
                            title={t.fiatPayout.qrAlt}
                        />
                    </YStack>

                    <YStack width={"100%"} gap={"$1.5"}>
                        <Overline>{t.fiatPayout.sendExactly}</Overline>
                        <Paragraph color={"$brandOffWhite"} style={mono(22, { fontWeight: 600 })}>
                            {depositText}
                        </Paragraph>
                    </YStack>

                    <CopyBox t={t} label={destinationLabel} value={destination} />
                    {tentative.asset_id ? (
                        <CopyBox t={t} label={t.fiatPayout.assetId} value={tentative.asset_id} />
                    ) : null}

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

            {tentative.status === "CREATED" ? (
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
                <BreakdownRow label={t.quote.youSend} value={depositText} />
                <BreakdownRow
                    label={t.fiatPayout.youReceive}
                    value={`${formatArsCents(arsCents, lang)} ARS`}
                />
                {tentative.alias ? (
                    <BreakdownRow label={t.fiatPayout.alias} value={tentative.alias} />
                ) : null}
            </YStack>

            {errorText ? <ErrorText>{errorText}</ErrorText> : null}

            <GhostButton onPress={onNewSwap}>{t.arsPayment.newOrder}</GhostButton>
        </Card>
    );
}
