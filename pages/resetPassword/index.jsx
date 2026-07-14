import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { YStack, H6, Paragraph } from "tamagui";
import errorIcon from "../../public/error.svg";
import infoIcon from "../../public/info.svg";
import eye from "../../public/eye.svg";
import eyeClosed from "../../public/eye-closed.svg";
import TamaguiButton from "../../components/TamaguiButton";
import TamaguiInput from "../../components/TamaguiInput";
import TamaguiGuide from "../../components/TamaguiGuide";
import NewHeaderButton from "../../components/newHeaderButton";
import { resetPassword } from "../../api/api";

const MIN_PASSWORD_LENGTH = 13;

export default function ResetPassword() {
    const router = useRouter();
    const [verificationCode, setVerificationCode] = useState(null);
    const [linkIsValid, setLinkIsValid] = useState(true);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [resetComplete, setResetComplete] = useState(false);

    useEffect(() => {
        if (!router.isReady) {
            return;
        }

        if (router.query.code) {
            setVerificationCode(router.query.code);
            setLinkIsValid(true);
        } else {
            setLinkIsValid(false);
        }
    }, [router.isReady, router.query.code]);

    const handleBackClick = () => {
        router.push("/login");
    };

    const handleSubmit = async () => {
        if (password.length < MIN_PASSWORD_LENGTH) {
            setErrorMessage(
                `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
            );
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);

        try {
            const response = await resetPassword(verificationCode, password);

            if (response.status !== 200) {
                throw new Error(response?.data?.error);
            }

            setResetComplete(true);
        } catch (error) {
            setLinkIsValid(false);
            setErrorMessage(
                error.message ||
                    "There has been an issue. Please, ask for a new link."
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
            {!linkIsValid ? (
                <YStack gap={"$6"} flex={1} justifyContent="center">
                    <TamaguiGuide
                        type={"error"}
                        icon={errorIcon}
                        text={
                            errorMessage ||
                            "There has been an error. Please try again or contact support."
                        }
                    />
                </YStack>
            ) : resetComplete ? (
                <YStack gap={"$6"} flex={1} justifyContent="center">
                    <H6 color="$neutral13" fontSize={"$6"} letterSpacing={"$3"}>
                        Password reset complete!
                    </H6>
                    <TamaguiGuide
                        type={"success"}
                        icon={infoIcon}
                        text={"You can now log in with your new password."}
                    />
                </YStack>
            ) : (
                <YStack gap={"$6"} flex={1}>
                    <Paragraph color="$neutral12" fontSize={"$3"}>
                        Please write your new password.
                    </Paragraph>
                    <TamaguiInput
                        value={password}
                        onChange={setPassword}
                        label={"New Password"}
                        placeholder={"Enter your new password"}
                        secureTextEntry={!showPassword}
                        icon={showPassword ? eyeClosed : eye}
                        onPressIcon={() => setShowPassword(!showPassword)}
                        error={!!errorMessage}
                        onKeyPress={(e) => {
                            if (e.key === "Enter" && !isLoading) {
                                handleSubmit();
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
                {!linkIsValid ? (
                    <TamaguiButton
                        text={"Send new reset password email"}
                        onClick={() => router.push("/recoverPassword")}
                    />
                ) : resetComplete ? (
                    <TamaguiButton
                        text={"Go to Login"}
                        onClick={() => router.push("/login")}
                    />
                ) : (
                    <TamaguiButton
                        onClick={handleSubmit}
                        text={"Reset password"}
                        isLoading={isLoading}
                    />
                )}
            </YStack>
        </YStack>
    );
}
