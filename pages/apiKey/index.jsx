import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { YStack, XStack, Paragraph, Text } from "tamagui";
import moment from "moment";
import NewHeaderButton from "../../components/newHeaderButton";
import TamaguiButton from "../../components/TamaguiButton";
import TamaguiIconButton from "../../components/TamaguiIconButton";
import { Spinner } from "../../components/CustomSpinner";
import CopyIcon from "../../public/copy_icon.svg";
import {
    getApiTokenStatus,
    generateApiToken,
    revokeApiToken,
} from "../../api/api";

const SUPPORT_URL = "https://wa.me/5491124060850";

export default function ApiKey() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const [generatedToken, setGeneratedToken] = useState(null);
    const [notEnabled, setNotEnabled] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // "regenerate" | "delete"
    const [copied, setCopied] = useState(false);
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
            const res = await generateApiToken();
            if (res.status === 201) {
                setGeneratedToken(res.data.token);
                setStatus((prev) => ({
                    ...prev,
                    token_prefix: res.data.token_prefix,
                }));
                setConfirmAction(null);
            } else if (res.status === 403) {
                setNotEnabled(true);
            } else {
                setError("Couldn't generate an API key. Please try again.");
            }
        } catch (e) {
            setError("Couldn't generate an API key. Please try again.");
        }
    };

    const handleRevoke = async () => {
        setError(null);
        try {
            const res = await revokeApiToken();
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
        setCopied(false);
        setError(null);
        setGeneratedToken(null);
        try {
            await loadStatus();
        } catch (e) {
            setError("Couldn't refresh your API key status. Please try again.");
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedToken);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            setError("Couldn't copy to clipboard. Please copy it manually.");
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
                            <TamaguiIconButton
                                icon={CopyIcon}
                                onClick={handleCopy}
                                label={copied ? "Copied" : "Copy"}
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
                    {error && (
                        <Paragraph color="$semanticRed" fontSize="$3">
                            {error}
                        </Paragraph>
                    )}
                    <TamaguiButton text="Done" onClick={handleRevealDone} />
                </YStack>
            );
        }

        if (status && status.is_active) {
            return (
                <YStack gap="$4" width="$width100">
                    <YStack {...cardProps}>
                        <XStack justifyContent="space-between" gap="$2">
                            <Paragraph color="$neutral10" fontSize="$3">
                                API key
                            </Paragraph>
                            <Paragraph color="$neutral13" fontSize="$3">
                                {status.token_prefix}…
                            </Paragraph>
                        </XStack>
                        <XStack justifyContent="space-between" gap="$2">
                            <Paragraph color="$neutral10" fontSize="$3">
                                Last used
                            </Paragraph>
                            <Paragraph color="$neutral13" fontSize="$3">
                                {status.last_used_at
                                    ? moment(status.last_used_at).format(
                                          "MMM Do, YYYY"
                                      )
                                    : "Never used"}
                            </Paragraph>
                        </XStack>
                    </YStack>

                    {error && (
                        <Paragraph color="$semanticRed" fontSize="$3">
                            {error}
                        </Paragraph>
                    )}

                    {confirmAction === "regenerate" ? (
                        <YStack gap="$3" width="$width100">
                            <Paragraph color="$neutral11" fontSize="$3">
                                Regenerate the API key? Your current key will
                                stop working immediately.
                            </Paragraph>
                            <TamaguiButton
                                text="Yes, regenerate"
                                onClick={handleGenerate}
                            />
                            <TamaguiButton
                                text="Cancel"
                                secondary
                                onClick={() => setConfirmAction(null)}
                            />
                        </YStack>
                    ) : confirmAction === "delete" ? (
                        <YStack gap="$3" width="$width100">
                            <Paragraph color="$neutral11" fontSize="$3">
                                Delete the API key? Any application using it
                                will stop working immediately.
                            </Paragraph>
                            <TamaguiButton
                                text="Yes, delete"
                                onClick={handleRevoke}
                            />
                            <TamaguiButton
                                text="Cancel"
                                secondary
                                onClick={() => setConfirmAction(null)}
                            />
                        </YStack>
                    ) : (
                        <YStack gap="$3" width="$width100">
                            <TamaguiButton
                                text="Regenerate"
                                secondary
                                onClick={() => {
                                    setError(null);
                                    setConfirmAction("regenerate");
                                }}
                            />
                            <TamaguiButton
                                text="Delete"
                                secondary
                                onClick={() => {
                                    setError(null);
                                    setConfirmAction("delete");
                                }}
                            />
                        </YStack>
                    )}
                </YStack>
            );
        }

        // No active token: fresh account or a previously revoked key.
        return (
            <YStack gap="$4" width="$width100">
                <Paragraph color="$neutral13" fontSize="$4" fontWeight="$2">
                    You don't have an active API key
                </Paragraph>
                <Paragraph color="$neutral11" fontSize="$3">
                    Generate an API key to access the WapuPay API from your own
                    applications and integrations.
                </Paragraph>
                {error && (
                    <Paragraph color="$semanticRed" fontSize="$3">
                        {error}
                    </Paragraph>
                )}
                <TamaguiButton
                    text="Generate API key"
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
