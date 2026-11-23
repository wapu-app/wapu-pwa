import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { YStack, XStack, Paragraph, Text } from "tamagui";
import moment from "moment";
import { QRCodeSVG } from "qrcode.react";
import NewHeaderButton from "../../components/newHeaderButton";
import TamaguiButton from "../../components/TamaguiButton";
import TamaguiInput from "../../components/TamaguiInput";
import CopyButton from "../../components/CopyButton";
import { Spinner } from "../../components/CustomSpinner";
import {
    getApiTokenStatus,
    generateApiToken,
    revokeApiToken,
} from "../../api/api";

const SUPPORT_URL = "https://wa.me/5491124060850";
const DEFAULT_LIMIT = 3;
const LIMIT_NOTE = (limit) =>
    `You have reached the limit of ${limit} active keys. Delete one to create another.`;

// Older backends only send the summary fields: show them as a single key.
const getKeys = (status) =>
    status.keys ||
    (status.is_active
        ? [
              {
                  id: null,
                  label: null,
                  token_prefix: status.token_prefix,
                  last_used_at: status.last_used_at,
              },
          ]
        : []);

export default function ApiKey() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const [generatedToken, setGeneratedToken] = useState(null);
    const [generatedLabel, setGeneratedLabel] = useState(null);
    const [label, setLabel] = useState("");
    const [notEnabled, setNotEnabled] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // id of the key being deleted
    const [error, setError] = useState(null);

    const loadStatus = async () => {
        const res = await getApiTokenStatus();
        if (res.status === 200) {
            setStatus(res.data);
            return;
        }
        throw new Error("Unexpected status response");
    };

    useEffect(() => {
        (async () => {
            try {
                await loadStatus();
            } catch (e) {
                setError("Couldn't load your API key status. Please try again.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleBack = () => {
        router.back();
    };

    const handleGenerate = async () => {
        setError(null);
        try {
            const res = await generateApiToken(label.trim());
            if (res.status === 201) {
                setGeneratedToken(res.data.token);
                setGeneratedLabel(res.data.label || null);
                setLabel("");
            } else if (res.status === 403) {
                setNotEnabled(true);
            } else if (res.status === 409) {
                setError(LIMIT_NOTE(res.data?.limit || DEFAULT_LIMIT));
                await loadStatus();
            } else {
                setError("Couldn't create an API key. Please try again.");
            }
        } catch (e) {
            setError("Couldn't create an API key. Please try again.");
        }
    };

    const handleRevoke = async (id) => {
        setError(null);
        try {
            const res = await revokeApiToken(id);
            if (res.status === 200) {
                setConfirmAction(null);
                await loadStatus();
            } else {
                setError("Couldn't delete the API key. Please try again.");
            }
        } catch (e) {
            setError("Couldn't delete the API key. Please try again.");
        }
    };

    const handleRevealDone = async () => {
        setError(null);
        setGeneratedToken(null);
        setGeneratedLabel(null);
        try {
            await loadStatus();
        } catch (e) {
            setError("Couldn't refresh your API key status. Please try again.");
        }
    };

    const cardProps = {
        width: "$width100",
        backgroundColor: "$neutral3",
        borderRadius: "$7",
        padding: "$4",
        gap: "$3",
    };

    const renderContent = () => {
        if (loading) {
            return (
                <YStack
                    flex={1}
                    alignItems="center"
                    justifyContent="center"
                    width="$width100"
                >
                    <Spinner />
                </YStack>
            );
        }

        if (notEnabled) {
            return (
                <YStack gap="$4" width="$width100">
                    <Paragraph color="$neutral13" fontSize="$4" fontWeight="$2">
                        API access is not enabled
                    </Paragraph>
                    <Paragraph color="$neutral11" fontSize="$3">
                        API access is not enabled for this account. Please
                        contact support to request access.
                    </Paragraph>
                    <TamaguiButton
                        text="Contact support"
                        href={SUPPORT_URL}
                        target="_blank"
                    />
                </YStack>
            );
        }

        if (generatedToken) {
            return (
                <YStack gap="$4" width="$width100">
                    <Paragraph color="$neutral13" fontSize="$4" fontWeight="$2">
                        Your new API key
                    </Paragraph>
                    {generatedLabel && (
                        <Paragraph color="$neutral11" fontSize="$3">
                            {generatedLabel}
                        </Paragraph>
                    )}
                    <YStack {...cardProps}>
                        <Paragraph color="$neutral10" fontSize="$2">
                            API key
                        </Paragraph>
                        <XStack
                            alignItems="center"
                            justifyContent="space-between"
                            gap="$2"
                        >
                            <Paragraph
                                flex={1}
                                color="$neutral13"
                                fontSize="$3"
                                style={{ wordBreak: "break-all" }}
                            >
                                {generatedToken}
                            </Paragraph>
                            <CopyButton
                                value={generatedToken}
                                onError={() =>
                                    setError(
                                        "Couldn't copy to clipboard. Please copy it manually."
                                    )
                                }
                                label="Copy"
                                colorLabel="$neutral13"
                                fontSizeLabel="$1"
                                gap="$1"
                            />
                        </XStack>
                    </YStack>
                    <Paragraph color="$semanticYellow" fontSize="$3">
                        Copy this key now and store it somewhere safe. For your
                        security, it won't be shown again.
                    </Paragraph>
                    <YStack
                        alignSelf="center"
                        width="$width100"
                        maxWidth={360}
                        padding="$4"
                        borderRadius="$7"
                        backgroundColor="#FFFFFF"
                    >
                        <QRCodeSVG
                            value={generatedToken}
                            size={512}
                            style={{ width: "100%", height: "auto" }}
                            aria-label="API key QR code"
                            title="API key QR code"
                        />
                    </YStack>
                    {error && (
                        <Paragraph color="$semanticRed" fontSize="$3">
                            {error}
                        </Paragraph>
                    )}
                    <TamaguiButton text="Done" onClick={handleRevealDone} />
                </YStack>
            );
        }

        if (!status) {
            return (
                <Paragraph color="$semanticRed" fontSize="$3">
                    {error}
                </Paragraph>
            );
        }

        const keys = getKeys(status);
        const limit = status.limit || DEFAULT_LIMIT;
        const limitReached = keys.length >= limit;

        return (
            <YStack gap="$4" width="$width100">
                {keys.length === 0 && (
                    <>
                        <Paragraph
                            color="$neutral13"
                            fontSize="$4"
                            fontWeight="$2"
                        >
                            You don't have an active API key
                        </Paragraph>
                        <Paragraph color="$neutral11" fontSize="$3">
                            Create an API key to access the WapuPay API from
                            your own applications and integrations.
                        </Paragraph>
                    </>
                )}
                {keys.map((k) => (
                    <YStack key={k.id ?? "legacy"} {...cardProps}>
                        <XStack justifyContent="space-between" gap="$2">
                            <Paragraph
                                flex={1}
                                color="$neutral13"
                                fontSize="$3"
                                fontWeight="$2"
                            >
                                {k.label || "Unnamed key"}
                            </Paragraph>
                            <Paragraph color="$neutral13" fontSize="$3">
                                {k.token_prefix}…
                            </Paragraph>
                        </XStack>
                        <XStack justifyContent="space-between" gap="$2">
                            <Paragraph color="$neutral10" fontSize="$3">
                                Last used
                            </Paragraph>
                            <Paragraph color="$neutral13" fontSize="$3">
                                {k.last_used_at
                                    ? moment(k.last_used_at).format(
                                          "MMM Do, YYYY"
                                      )
                                    : "Never used"}
                            </Paragraph>
                        </XStack>
                        {confirmAction === k.id ? (
                            <YStack gap="$3" width="$width100">
                                <Paragraph color="$neutral11" fontSize="$3">
                                    Delete this API key? Any application using
                                    it will stop working immediately.
                                </Paragraph>
                                <TamaguiButton
                                    text="Yes, delete"
                                    onClick={() => handleRevoke(k.id)}
                                />
                                <TamaguiButton
                                    text="Cancel"
                                    secondary
                                    onClick={() => setConfirmAction(null)}
                                />
                            </YStack>
                        ) : (
                            <TamaguiButton
                                text="Delete"
                                secondary
                                onClick={() => {
                                    setError(null);
                                    setConfirmAction(k.id);
                                }}
                            />
                        )}
                    </YStack>
                ))}

                <Paragraph color="$neutral10" fontSize="$3">
                    {keys.length} of {limit} keys in use
                </Paragraph>
                <TamaguiInput
                    label="Label (optional)"
                    placeholder="e.g. Production server"
                    value={label}
                    onChange={setLabel}
                    maxLength={64}
                />
                {limitReached && (
                    <Paragraph color="$semanticYellow" fontSize="$3">
                        {LIMIT_NOTE(limit)}
                    </Paragraph>
                )}
                {error && !(limitReached && error === LIMIT_NOTE(limit)) && (
                    <Paragraph color="$semanticRed" fontSize="$3">
                        {error}
                    </Paragraph>
                )}
                <TamaguiButton
                    text="Create API key"
                    isDisabled={limitReached}
                    onClick={handleGenerate}
                />
            </YStack>
        );
    };

    return (
        <YStack
            flex={1}
            width="$width90"
            backgroundColor="$neutral1"
            paddingBottom="$5"
        >
            <NewHeaderButton onClick={handleBack}>API Key</NewHeaderButton>
            <YStack flex={1} marginTop="$6" width="$width100">
                {renderContent()}
            </YStack>
        </YStack>
    );
}
