import React, { useEffect, useState } from "react";
import error from "../../public/error.svg";
import info from "../../public/info.svg";
import eye from "../../public/eye.svg";
import eyeClosed from "../../public/eye-closed.svg";
import { YStack, XStack, H6, Paragraph } from "tamagui";
import TamaguiButton from "../../components/TamaguiButton";
import TamaguiInput from "../../components/TamaguiInput";
import TamaguiCheckbox from "../../components/TamaguiCheckbox";
import TamaguiGuide from "../../components/TamaguiGuide";
import TamaguiProgressBar from "../../components/TamaguiProgressBar";
import NewHeaderButton from "../../components/newHeaderButton";
import { signupUser, loginWithTempPassword } from "../../api/api";
import { createLog } from "../../utils/createLog";
import Cookies from "js-cookie";
import useUserAgent from "../../hooks/userAgent";
import { useRouter } from "next/router";
import onboarding_image from "../../public/icons/onboarding_image.svg";
import Image from "next/image";
export default function index() {
    const [showEmailVerificationProcess, setShowEmailVerificationProcess] =
        useState(false);
    const [showVerificationSended, setShowVerificationSended] = useState(false);
    const [email, setEmail] = useState("");
    const [tempPassword, setTempPass] = useState(null);
    const [password, setPassword] = useState("");
    const [referralCode, setReferralCode] = useState("");
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [safeLevel, setSafeLevel] = useState("Safe Level");
    const [progress, setProgress] = useState(0);
    const [checkTerms, setCheckTerms] = useState(false);
    const [notShow, setNotShow] = useState(false);

    const { userAgent, isIOS, isStandalone, isMobile } = useUserAgent();
    const router = useRouter();

    const handleIconPressed = () => {
        setNotShow(!notShow);
    };

    const handlePasswordChange = (value) => {
        const newPassword = value;
        setPassword(newPassword);

        if (newPassword !== "" && newPassword.length < 13) {
            setSafeLevel("Unsafe");
            setProgress(33);
        } else if (newPassword.length > 12 && newPassword.length <= 16) {
            setSafeLevel("Weak");
            setProgress(66);
        } else if (newPassword.length >= 17) {
            setSafeLevel("Safe");
            setProgress(100);
        } else {
            setSafeLevel("Safe Level");
            setProgress(0);
        }
    };

    const handleShowVerification = () => {
        setShowEmailVerificationProcess(true);
    };

    const handleSubmit = async () => {
        if (password.length < 13) {
            setErrorMessage("Password must be at least 13 characters long.");
            return;
        }

        try {
            const response = await signupUser(email, password, referralCode);
            if (response.status === 400 || response.status === 409) {
                throw new Error(response?.data?.error);
            }

            Cookies.set("access_token", response.data.access_token, {
                path: "/",
                sameSite: "strict",
                expires: 1, // same duration than refresh token cookie
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
                "signup",
                { email: email }
            );
            setShowVerificationSended(true);
        } catch (error) {
            if (error.message) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage(
                    "There has been a problem. Please try again later or contact support."
                );
            }
            await createLog(
                userAgent,
                isIOS,
                isStandalone,
                isMobile,
                "signup",
                {
                    email: email,
                    errorMessage: error.message,
                    errorModalState: true,
                }
            );
        }
    };
    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => {
                setErrorMessage(null);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [errorMessage]);
    useEffect(() => {
        if (router.asPath !== router.route) {
            if (router.query.tempPassword) {
                setTempPass(router.query.tempPassword);
            }

            if (router.query.ref) {
                setReferralCode(router.query.ref);
                handleShowVerification();
            }
        }
    }, [router]);

    const handleBackClick = () => {
        if (showEmailVerificationProcess && !showVerificationSended) {
            setShowEmailVerificationProcess(false);
        } else if (showEmailVerificationProcess && showVerificationSended) {
            setShowVerificationSended(false);
        }
    };

    useEffect(() => {
        const loginWithToken = async () => {
            try {
                const response = await loginWithTempPassword(tempPassword);
                if (response.status === 400 || response.status === 404) {
                    setErrorMessage(response?.data?.error);
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
        if (tempPassword !== "" && tempPassword !== null) {
            loginWithToken();
        }
    }, [tempPassword]);

    return (
        <YStack
            height="$height100"
            width="$width90"
            paddingBottom={"$5"}
            paddingTop={"$5"}
            justifyContent="flex-end"
        >
            {showEmailVerificationProcess ? (
                /* Email Verification SCREEN */
                <YStack
                    height={"$height100"}
                    width={"$width100"}
                    justifyContent="space-between"
                    gap={"$8"}
                    overflow="auto"
                    scrollbarWidth="thin"
                >
                    <NewHeaderButton onClick={handleBackClick} />
                    {showVerificationSended ? (
                        <>
                            <YStack gap={"24px"}>
                                <H6 color={"$neutral13"}>
                                    Great! We sent you verification to your
                                    email.
                                </H6>
                                <Paragraph
                                    color={"$neutral12"}
                                    fontWeight={"$1"}
                                >
                                    Please verify the inbox of your email
                                    address that you shared us.
                                </Paragraph>
                            </YStack>
                            <YStack gap={"25px"}>
                                <TamaguiButton
                                    text={"Open Gmail"}
                                    href={"https://mail.google.com/"}
                                    target={"_blank"}
                                />
                                <TamaguiButton
                                    text={"Open Mail App"}
                                    href={"mailto:"}
                                    target={"_blank"}
                                    secondary
                                />
                                <TamaguiButton
                                    text={"Need Help?"}
                                    href={"https://wapupay.com/help/"}
                                    target={"_blank"}
                                    terciary
                                />
                            </YStack>
                        </>
                    ) : (
                        <>
                            <YStack gap={"$8"}>
                                <H6
                                    color="$neutral13"
                                    fontSize={"$6"}
                                    letterSpacing={"$3"}
                                    lineHeight="29.52px"
                                >
                                    Nice to meet you! <br></br> Let's connect to
                                    Wapu
                                </H6>
                                <YStack width={"$width100"} gap={"$6"}>
                                    {/* INPUTS */}
                                    <TamaguiInput
                                        value={email}
                                        onChange={setEmail}
                                        label={"Email Address"}
                                        placeholder={"Enter your email address"}
                                        icon={false}
                                    />
                                    <TamaguiInput
                                        value={password}
                                        onChange={handlePasswordChange}
                                        label={"Password"}
                                        placeholder={"Enter your password"}
                                        secureTextEntry={notShow ? false : true}
                                        icon={notShow ? eyeClosed : eye}
                                        onPressIcon={handleIconPressed}
                                        onFocusChange={
                                            setIsPasswordFocused
                                        } /* to show TamaguiGuide */
                                    />
                                    {/* REFERRAL OPTION */}
                                    {false ? (
                                        <TamaguiInput
                                            placeholder={
                                                "Enter your referral code"
                                            }
                                            value={referralCode}
                                            onChange={setReferralCode}
                                        />
                                    ) : (
                                        <></>
                                    )}
                                    {/* GUIDE (FOR ERRORS AND INFO) */}
                                    {errorMessage || isPasswordFocused ? (
                                        <TamaguiGuide
                                            type={
                                                errorMessage
                                                    ? "error"
                                                    : isPasswordFocused
                                                    ? "info"
                                                    : ""
                                            }
                                            icon={
                                                errorMessage
                                                    ? error
                                                    : isPasswordFocused
                                                    ? info
                                                    : ""
                                            }
                                            text={
                                                errorMessage ||
                                                (isPasswordFocused &&
                                                    "Password is recommended to be more than 22 characters including lowercase, uppercase, number, and special character.")
                                            }
                                        />
                                    ) : (
                                        ""
                                    )}
                                    {/* PROGRESS BAR */}
                                    <XStack
                                        width={"$width100"}
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        gap={"1rem"}
                                    >
                                        <TamaguiProgressBar
                                            sizeProp={2}
                                            progress={progress}
                                            status={safeLevel}
                                            width={"70%"}
                                        />
                                        <Paragraph
                                            color={
                                                safeLevel === "Unsafe"
                                                    ? "$semanticRed"
                                                    : safeLevel === "Weak"
                                                    ? "$semanticYellow"
                                                    : safeLevel === "Safe"
                                                    ? "$semanticGreen"
                                                    : "$semanticGray"
                                            }
                                            fontSize={"$4"}
                                            fontWeight={"$1"}
                                        >
                                            {safeLevel}
                                        </Paragraph>
                                    </XStack>
                                </YStack>
                            </YStack>
                            <YStack gap={"$5"}>
                                <TamaguiCheckbox
                                    value={checkTerms}
                                    onClick={() => setCheckTerms(!checkTerms)}
                                    size={1}
                                    label={
                                        <Paragraph color={"$neutral11"}>
                                            By registering, you accept our
                                            <a
                                                href={
                                                    "https://wapupay.com/terms-and-conditions/"
                                                }
                                                target="_blank"
                                                style={{
                                                    color: "#A09FA6",
                                                    margin: "0 1px",
                                                }}
                                            >
                                                Terms and Conditions
                                            </a>
                                            and
                                            <a
                                                href={
                                                    "https://wapupay.com/privacy-policy/"
                                                }
                                                target="_blank"
                                                style={{
                                                    color: "#A09FA6",
                                                    margin: "0 1px",
                                                }}
                                            >
                                                Privacy Policy
                                            </a>
                                            .
                                        </Paragraph>
                                    }
                                />
                                <TamaguiButton
                                    onClick={() => {
                                        handleSubmit();
                                    }}
                                    text={"Next"}
                                    //isDisabled /* to condition the button */
                                    isDisabled={checkTerms ? false : true}
                                />
                            </YStack>
                        </>
                    )}
                </YStack>
            ) : (
                /* Signup, login, Need help SCREEN  */
                <YStack
                    height={"$height100"}
                    width={"$width100"}
                    gap={"$8"}
                    justifyContent="space-between"
                >
                    <YStack /> {/* To balance layout */}
                    {errorMessage ? (
                        <TamaguiGuide
                            type={"error"}
                            icon={error}
                            text={errorMessage}
                        />
                    ) : (
                        <></>
                    )}
                    <YStack alignItems="center">
                        <YStack width={"$width100"} alignItems="center">
                            <Image src={onboarding_image} alt="icon"></Image>
                        </YStack>

                        <YStack
                            width={"$width100"}
                            justifyContent="center"
                            alignItems="center"
                            gap={"$8"}
                        >
                            <H6
                                color={"$neutral13"}
                                lineHeight="1.6rem"
                                textAlign="center"
                            >
                                Be a nomad,<br></br>Pay like locals
                            </H6>
                            <Paragraph
                                color={"$neutral12"}
                                size={"$3"}
                                letterSpacing={"$3"}
                                weight={"$2"}
                                textAlign="center"
                            >
                                Deposit your digital dollar,<br></br>and pay in
                                your local life
                            </Paragraph>
                        </YStack>
                    </YStack>
                    <YStack gap={"$3.5"}>
                        <TamaguiButton
                            text={"Sign Up"}
                            onClick={handleShowVerification}
                        />
                        <TamaguiButton
                            text={"Login"}
                            onClick={() => router.push("/login")}
                            secondary
                        />
                        <TamaguiButton
                            text={"Login by Link"}
                            onClick={() =>
                                router.push("/login?type=magic-link")
                            }
                            secondary
                        />
                        <TamaguiButton
                            text={"Need Help?"}
                            href={"https://wapupay.com/help/"}
                            target={"_blank"}
                            terciary
                        />
                    </YStack>
                </YStack>
            )}
        </YStack>
    );
}
