import { useState, useEffect } from "react";
import error from "../../public/error.svg";
import inbox from "../../public/inbox.svg";
import eye from "../../public/eye.svg";
import eyeClosed from "../../public/eye-closed.svg";
import { YStack, H6 } from "tamagui";
import TamaguiButton from "../../components/TamaguiButton";
import TamaguiIconButton from "../../components/TamaguiIconButton";
import TamaguiInput from "../../components/TamaguiInput";
import TamaguiLink from "../../components/TamaguiLink";
import TamaguiGuide from "../../components/TamaguiGuide";
import arrowBackIcon from "../../public/arrowBack.svg";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { createLog } from "../../utils/createLog";
import {
    loginUser,
    loginWithTempPassword,
    sendLoginEmail,
} from "../../api/api";
import { useUserContext } from "../../context/userContext";
import useUserAgent from "../../hooks/userAgent";

function Login() {
    Cookies.set("isLoggedIn", "false", { path: "/", sameSite: "strict" });
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState(null);
    const [loginMessage, setLoginMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { notShow, setNotShow } = useUserContext();
    const router = useRouter();
    const { userAgent, isIOS, isStandalone, isMobile } = useUserAgent();
    const { query } = router;
    const isMagicLink = query.type === "magic-link";
    const tempPassword = query.tempPassword || "";

    useEffect(() => {
        const loginWithToken = async () => {
            try {
                const response = await loginWithTempPassword(tempPassword);

                if (response.status === 400 || response.status === 404) {
                    throw new Error(response?.data?.error);
                }
                Cookies.set("access_token", response.data.access_token, {
                    path: "/",
                    sameSite: "strict",
                    expires: 1,
                });
                Cookies.set("isLoggedIn", "true", {
                    path: "/",
                    sameSite: "strict",
                    expires: 1,
                });
                router.push("/home");
            } catch (error) {
                setErrorMessage(error.message);
            }
        };

        if (isMagicLink && tempPassword) {
            loginWithToken();
        }
    }, [isMagicLink, tempPassword]);

    const handleIconPressed = () => {
        setNotShow((prevState) => !prevState);
    };

    const handleSignIn = async () => {
        setIsLoading(true);
        
        if (isMagicLink) {
            try {
                const response = await sendLoginEmail(email);

                if (response.status === 400 || response.status === 404) {
                    throw new Error(response?.data?.error);
                }

                await createLog(
                    userAgent,
                    isIOS,
                    isStandalone,
                    isMobile,
                    "login by link",
                    { email }
                );
                setLoginMessage(
                    "Please check your email inbox for a login link."
                );
                setErrorMessage(null);
                setIsLoading(false); // Reset after success for magic link
            } catch (error) {
                setErrorMessage(
                    error.message || "An unexpected error occurred"
                );
                setLoginMessage(null);
                setIsLoading(false); // Reset on error
                await createLog(
                    userAgent,
                    isIOS,
                    isStandalone,
                    isMobile,
                    "login by link",
                    {
                        email,
                        errorMessage:
                            error.message || "An unexpected error occurred",
                        errorModalState: true,
                    }
                );
            }
        } else {
            try {
                const response = await loginUser(email, password);

                if (response.status === 400 || response.status === 404) {
                    throw new Error(response?.data?.error);
                }

                Cookies.set("access_token", response.data.access_token, {
                    path: "/",
                    sameSite: "strict",
                    expires: 1,
                });
                Cookies.set("isLoggedIn", true, {
                    path: "/",
                    sameSite: "strict",
                    expires: 1,
                });

                await createLog(
                    userAgent,
                    isIOS,
                    isStandalone,
                    isMobile,
                    "login",
                    { email }
                );
                // Don't reset loading state on success - let the page unmount
                router.push("/home");
            } catch (error) {
                setErrorMessage(
                    error.message || "An unexpected error occurred"
                );
                setLoginMessage(null);
                setIsLoading(false); // Only reset on error

                await createLog(
                    userAgent,
                    isIOS,
                    isStandalone,
                    isMobile,
                    "login",
                    {
                        email,
                        errorMessage:
                            error.message || "An unexpected error occurred",
                        errorModalState: true,
                    }
                );
            }
        }
    };

    const handleBackClick = () => {
        router.back();
    };

    return (
        <YStack
            height="$height100"
            width="$width90"
            justifyContent="space-between"
            paddingBottom={"$5"}
            paddingTop={"$5"}
        >
            <TamaguiIconButton
                onClick={handleBackClick}
                icon={arrowBackIcon}
                style={{
                    alignSelf: "flex-start",
                }}
            />
            <YStack width={"$width100"} gap={"$8"}>
                <H6
                    color="$neutral13"
                    fontSize={"$6"}
                    letterSpacing={"$3"}
                    lineHeight="29.52px"
                >
                    Nice to meet you! <br></br> Let's connect to Wapu
                </H6>
                <YStack
                    width={"$width100"}
                    gap={"$6"}
                    alignItems="flex-end"
                    padding={"$2"}
                >
                    <TamaguiInput
                        value={email}
                        onChange={setEmail}
                        label={"Email Address"}
                        placeholder={"Enter your email address"}
                        icon={false}
                    />
                    {!isMagicLink && (
                        <TamaguiInput
                            value={password}
                            onChange={setPassword}
                            label={"Password"}
                            placeholder={"Enter your password"}
                            secureTextEntry={notShow ? false : true}
                            icon={notShow ? eyeClosed : eye}
                            onPressIcon={handleIconPressed}
                            onKeyPress={(e) => {
                                if (e.key === "Enter" && !isLoading) {
                                    handleSignIn();
                                }
                            }}
                        />
                    )}
                    {!isMagicLink && (
                        <TamaguiLink
                            text={"Forgot password?"}
                            onClick={() => router.push("/recoverPassword")}
                            target="_blank"
                        />
                    )}
                    {errorMessage ? (
                        <TamaguiGuide
                            type={"error"}
                            icon={error}
                            text={errorMessage}
                        />
                    ) : (
                        loginMessage && (
                            <TamaguiGuide
                                type={"success"}
                                icon={inbox}
                                text={loginMessage}
                            />
                        )
                    )}
                </YStack>
            </YStack>
            <YStack gap="$3.5">
                <TamaguiButton
                    onClick={() => handleSignIn()}
                    text={isMagicLink ? "Send Magic Link" : "Go to Wapupay"}
                    isLoading={isLoading}
                />
            </YStack>
        </YStack>
    );
}

export default Login;
