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
    directFiatDepositBaseUnits,
    formatAssetAmount,
    sans,
} from "./primitives";

// Phase 2 of a crypto -> ARS order: the bank account that receives the pesos.
// The backend validates the alias/CBU/CVU itself (and, with its flag on,
// against Fiwind), so the client only checks that it is not empty. The
// transfer type is always fast_fiat_transfer: there is no selector.
export default function FiatDetailsForm({
    t,
    lang,
    from,
    btcUnit,
    quote,
    alias,
    receiverName,
    onAliasChange,
    onReceiverNameChange,
    onBack,
    onSubmit,
    submitting,
    submitError,
}) {
    const [touched, setTouched] = useState(false);
    const aliasError = String(alias || "").trim() ? null : t.fiatDetails.required;

    const handleSubmit = () => {
        setTouched(true);
        if (aliasError || submitting) {
            return;
        }
        onSubmit();
    };

    return (
        <Card>
            <YStack gap={"$2"}>
                <Paragraph color={"$brandOffWhite"} style={sans(18, { fontWeight: 800 })}>
                    {t.fiatDetails.title}
                </Paragraph>
                <Paragraph color={"$neutral11"} style={sans(13)}>
                    {t.fiatDetails.subtitle}
                </Paragraph>
            </YStack>

            <YStack gap={"$2"}>
                <Overline>{t.fiatDetails.aliasLabel}</Overline>
                <TextField
                    value={alias}
                    onChange={onAliasChange}
                    placeholder={t.fiatDetails.aliasPlaceholder}
                    ariaLabel={t.fiatDetails.aliasLabel}
                    invalid={touched && Boolean(aliasError)}
                />
                {touched && aliasError ? <ErrorText>{aliasError}</ErrorText> : null}
            </YStack>

            <YStack gap={"$2"}>
                <Overline>{t.fiatDetails.nameLabel}</Overline>
                <TextField
                    value={receiverName}
                    onChange={onReceiverNameChange}
                    placeholder={t.fiatDetails.namePlaceholder}
                    ariaLabel={t.fiatDetails.nameLabel}
                />
            </YStack>

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
                        value={formatAssetAmount(directFiatDepositBaseUnits(quote, from), from, {
                            btcUnit,
                            network: true,
                        })}
                    />
                    <BreakdownRow
                        label={t.quote.youGet}
                        value={formatAssetAmount(Math.round(Number(quote.amount_ars) * 100), "ARS", {
                            lang,
                        })}
                    />
                </YStack>
            ) : null}

            {submitError ? <ErrorText>{submitError}</ErrorText> : null}

            <YStack gap={"$2.5"}>
                <PrimaryButton onPress={handleSubmit} disabled={submitting}>
                    {submitting ? t.fiatDetails.submitting : t.fiatDetails.submit}
                </PrimaryButton>
                <GhostButton onPress={onBack}>{t.addresses.back}</GhostButton>
            </YStack>
        </Card>
    );
}
