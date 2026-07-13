import { useState } from "react";
import { useRouter } from "next/router";
import { YStack, H6, Paragraph } from "tamagui";
import errorIcon from "../../public/error.svg";
import inbox from "../../public/inbox.svg";
import TamaguiButton from "../../components/TamaguiButton";
import TamaguiInput from "../../components/TamaguiInput";
import TamaguiGuide from "../../components/TamaguiGuide";
import NewHeaderButton from "../../components/newHeaderButton";
import { sendRecoverPasswordEmail } from "../../api/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RecoverPassword() {
    const [email, setEmail] = useState("");
    const [errorMessage, setErrorMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const router = useRouter();

    const handleBackClick = () => {
        router.back();
    };

    const handleSendRecoveryEmail = async () => {
        if (!EMAIL_REGEX.test(email)) {
            setErrorMessage("Please enter a valid email address.");
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);

        try {
            const response = await sendRecoverPasswordEmail(email);

            if (response.status !== 200) {
                throw new Error(response?.data?.error);
            }

            setEmailSent(true);
        } catch (error) {
            setErrorMessage(
                error.message || "An unexpected error occurred"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <YStack
            height="$height100"
            width="$width90"
            justifyContent="space-between"
            paddingBottom={"$5"}
            paddingTop={"$5"}
        >
            <NewHeaderButton onClick={handleBackClick}>
                Reset Password
            </NewHeaderButton>
            {emailSent ? (
                <YStack gap={"$6"} flex={1} justifyContent="center">
                    <H6 color="$neutral13" fontSize={"$6"} letterSpacing={"$3"}>
                        Check your inbox
                    </H6>
                    <TamaguiGuide
                        type={"success"}
                        icon={inbox}
                        text={`We've sent a password recovery link to ${email}. Please check your inbox.`}
                    />
                </YStack>
            ) : (
                <YStack gap={"$6"} flex={1}>
                    <Paragraph color="$neutral12" fontSize={"$3"}>
                        Enter the email associated with your account and
                        we&apos;ll send you a link to reset your password.
                    </Paragraph>
                    <TamaguiInput
                        value={email}
                        onChange={setEmail}
                        label={"Email"}
                        placeholder={"Enter your email address"}
                        icon={false}
                        error={!!errorMessage}
                        onKeyPress={(e) => {
                            if (e.key === "Enter" && !isLoading) {
                                handleSendRecoveryEmail();
                            }
                        }}
                    />
                    {errorMessage && (
                        <TamaguiGuide
                            type={"error"}
                            icon={errorIcon}
                            text={errorMessage}
                        />
                    )}
                </YStack>
            )}
            <YStack gap={"$3.5"}>
                {emailSent ? (
                    <TamaguiButton
                        text={"Back to Login"}
                        onClick={() => router.push("/login")}
                        secondary
                    />
                ) : (
                    <TamaguiButton
                        onClick={handleSendRecoveryEmail}
                        text={"Send link"}
                        isLoading={isLoading}
                    />
                )}
            </YStack>
        </YStack>
    );
}

export default RecoverPassword;
