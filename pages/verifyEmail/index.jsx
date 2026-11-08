import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
    CheckIcon,
    EnvelopeIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { H1, Paragraph, YStack } from "tamagui";
import TamaguiButton from "../../components/TamaguiButton";
import TamaguiInput from "../../components/TamaguiInput";
import { getVerifyCode, sendVerificationEmail } from "../../api/api";

const CONTENT = {
    loading: {
        title: "Verifying your email",
        description: "Just a moment while we confirm your email address.",
    },
    success: {
        title: "Email verified!",
        description:
            "Your email is confirmed. You're ready to continue with Wapu.",
    },
    invalid: {
        title: "Let's try a new link",
        description:
            "This verification link has expired or is invalid. Request a new one to confirm your email.",
    },
    error: {
        title: "We couldn't verify your email",
        description:
            "There was a connection problem. Please try again in a moment.",
    },
    resend: {
        title: "Get a new verification link",
        description:
            "Enter the email address you used to sign up and we'll send you a new link.",
    },
    sent: {
        title: "Check your inbox",
        description:
            "We've sent you a new verification link. Open it to confirm your email. If you don't see it, check your spam folder.",
    },
};

export default function VerifyEmail() {
    const router = useRouter();
    const { code } = router.query;
    const [status, setStatus] = useState("loading");
    const [attempt, setAttempt] = useState(0);
    const [email, setEmail] = useState("");
    const [sendError, setSendError] = useState("");
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (!router.isReady) return;
        if (typeof code !== "string" || !code.trim()) {
            setStatus("invalid");
            return;
        }

        let cancelled = false;
        setStatus("loading");
        const verify = async () => {
            try {
                const response = await getVerifyCode(code);
                if (!cancelled) {
                    setStatus(
                        response.status === 200
                            ? "success"
                            : response.status >= 500
                            ? "error"
                            : "invalid"
                    );
                }
            } catch {
                if (!cancelled) setStatus("error");
            }
        };
        verify();
        return () => {
            cancelled = true;
        };
    }, [router.isReady, code, attempt]);

    const sendLink = async () => {
        if (isSending) return;
        const address = email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
            setSendError("Please enter a valid email address.");
            return;
        }
        setIsSending(true);
        setSendError("");
        try {
            const response = await sendVerificationEmail(address);
            if (response.status !== 200) {
                setSendError(
                    "We couldn't send the link. Please try again in a moment."
                );
                return;
            }
            setStatus("sent");
        } catch {
            setSendError(
                "We couldn't send the link. Check your connection and try again."
            );
        } finally {
            setIsSending(false);
        }
    };

    const content = CONTENT[status];
    const StatusIcon =
        status === "success"
            ? CheckIcon
            : ["invalid", "error"].includes(status)
            ? ExclamationTriangleIcon
            : EnvelopeIcon;

    return (
        <>
            <Head>
                <title>{content.title} | Wapu</title>
            </Head>
            <YStack
                width="$width90"
                maxWidth={440}
                paddingVertical="$6"
                gap="$8"
                flexShrink={0}
            >
                <YStack
                    alignItems="center"
                    gap="$5"
                    role="status"
                    aria-live="polite"
                    aria-busy={status === "loading"}
                >
                    <YStack
                        width={88}
                        height={88}
                        borderRadius="$8"
                        backgroundColor="$neutral3"
                        color={status === "success" ? "$brandMint" : "$pink300"}
                        alignItems="center"
                        justifyContent="center"
                        aria-hidden="true"
                    >
                        <StatusIcon width={40} height={40} />
                    </YStack>
                    <YStack gap="$3.5" alignItems="center">
                        <H1
                            fontFamily="$heading"
                            fontSize="$5"
                            fontWeight="$2"
                            lineHeight={36}
                            color="$neutral13"
                            textAlign="center"
                        >
                            {content.title}
                        </H1>
                        <Paragraph
                            fontFamily="$body"
                            fontSize="$3"
                            lineHeight={24}
                            fontWeight="400"
                            color="$neutral12"
                            textAlign="center"
                        >
                            {content.description}
                        </Paragraph>
                    </YStack>
                </YStack>
                <YStack gap="$3.5">
                    {status === "resend" && (
                        <YStack gap="$3.5">
                            <TamaguiInput
                                value={email}
                                onChange={setEmail}
                                label="Email address"
                                aria-label="Email address"
                                placeholder="Enter your email address"
                                type="email"
                                autoComplete="email"
                                autoCapitalize="none"
                                error={!!sendError}
                                aria-invalid={!!sendError}
                                aria-describedby={
                                    sendError
                                        ? "verification-send-error"
                                        : undefined
                                }
                                onKeyPress={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        sendLink();
                                    }
                                }}
                            />
                            {sendError && (
                                <Paragraph
                                    id="verification-send-error"
                                    role="alert"
                                    color="$pink200"
                                    fontSize="$3"
                                >
                                    {sendError}
                                </Paragraph>
                            )}
                            <TamaguiButton
                                text={
                                    isSending
                                        ? "Sending link..."
                                        : "Send verification link"
                                }
                                onClick={sendLink}
                                isDisabled={isSending}
                                isLoading={isSending}
                            />
                        </YStack>
                    )}
                    {status === "success" && (
                        <TamaguiButton
                            text="Continue to Wapu"
                            onClick={() => router.push("/home")}
                        />
                    )}
                    {status === "invalid" && (
                        <TamaguiButton
                            text="Get a new link"
                            onClick={() => setStatus("resend")}
                        />
                    )}
                    {status === "error" && (
                        <TamaguiButton
                            text="Try again"
                            onClick={() => setAttempt((value) => value + 1)}
                        />
                    )}
                    {["invalid", "error", "resend", "sent"].includes(
                        status
                    ) && (
                        <TamaguiButton
                            text="Back to login"
                            secondary
                            onClick={() => router.push("/login")}
                        />
                    )}
                </YStack>
            </YStack>
        </>
    );
}
