"use client";
import { Paragraph, XStack, YStack } from "tamagui";

import CopyButton from "../CopyButton";
import { Overline, WarningBanner, arsCentsToPlain, formatArsCents, mono } from "./primitives";

// Bank-transfer instructions of an ARS purchase. The amount comes from the swap
// (`amount_in_expected`), never from the quote — see docs/swaps-page.md.
export default function ArsPaymentInstructions({ t, lang, swap, countdown }) {
    const amountText = `${formatArsCents(swap.amount_in_expected, lang)} ARS`;

    return (
        <YStack gap={"$3"}>
            <YStack gap={"$1.5"}>
                <Overline>{t.arsPayment.alias}</Overline>
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
                        style={mono(15, { wordBreak: "break-all", fontWeight: 600 })}
                    >
                        {swap.deposit_address}
                    </Paragraph>
                    <CopyButton
                        value={swap.deposit_address}
                        size={"28px"}
                        copyLabel={t.status.copyAria(t.arsPayment.alias)}
                        copiedLabel={t.status.copied}
                    />
                </XStack>
            </YStack>

            <YStack gap={"$1.5"}>
                <Overline>{t.arsPayment.amount}</Overline>
                <XStack alignItems="center" gap={"$2"}>
                    <Paragraph
                        flex={1}
                        color={"$brandOffWhite"}
                        style={mono(24, { fontWeight: 600 })}
                    >
                        {amountText}
                    </Paragraph>
                    {/* Copies "15000.30": what a banking app accepts. */}
                    <CopyButton
                        value={arsCentsToPlain(swap.amount_in_expected)}
                        size={"28px"}
                        copyLabel={t.status.copyAria(t.arsPayment.amount)}
                        copiedLabel={t.status.copied}
                    />
                </XStack>
            </YStack>

            <WarningBanner>{t.arsPayment.exactWarning}</WarningBanner>

            {countdown ? (
                <XStack justifyContent="space-between" alignItems="center" gap={"$3"}>
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
    );
}
