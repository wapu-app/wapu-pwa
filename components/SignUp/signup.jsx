"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/Button";
import { ButtonRequest } from "../../components/ButtonRequest";
import { CustomInput } from "../../components/Input";
import { createLog } from "../../utils/createLog";
import useUserAgent from "../../hooks/userAgent";
import Cookies from "js-cookie";
import Icon from "@mdi/react";
import { mdiEyeOff, mdiEye } from "@mdi/js";
import {
    InputContainer,
    CustomTitle,
    SignupForm,
    RegisterContainer,
    ModalContainer,
    CustomModal,
    customStyles,
    PTextMin,
    ReferralContainer,
    CustomTerms,
    Input,
} from "./styled";
import ErrorModal from "../../components/ErrorModal";
import { signupUser } from "../../api/api";

function SignUp({ isOpen, setIsOpen, referralCode }) {
    const { userAgent, isIOS, isStandalone, isMobile } = useUserAgent();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [referral, setReferral] = useState(referralCode || ""); // Use the referralCode to set the init state
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorModalState, setErrorModalState] = useState(false);
    const [showReferral, setShowReferral] = useState(false);
    const [checkTerms, setcheckTerms] = useState(false);
    const [passwordHidden, setPasswordHidden] = useState(true);
    const hidePassword = () => {
        setPasswordHidden((prevState) => !prevState);
    };
    const router = useRouter();

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };
    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handleReferralChange = (e) => {
        setReferral(e.target.value);
    };
    const handleCheckboxChange = (e) => {
        setShowReferral(!showReferral);
    };
    useEffect(() => {
        setReferral(referralCode || "");
    }, [referralCode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await signupUser(email, password, referral);

            if (response.status === 400 || response.status === 409) {
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
                "signup",
                { email: email }
            );
            router.push("/home?new_user=true");
        } catch (error) {
            if (error.message) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage(
                    "There has been a problem. Please try again later or contact support."
                );
            }
            setErrorModalState(true);
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

    return (
        <RegisterContainer>
            <Button
                text="Create account"
                onClick={() => {
                    setIsOpen(true);
                }}
            />
            <CustomModal
                isOpen={isOpen}
                onRequestClose={() => setIsOpen(false)}
                style={customStyles}
            >
                <CustomTitle>Create account</CustomTitle>
                <ModalContainer>
                    <SignupForm>
                        <InputContainer>
                            <CustomInput
                                label={"Email"}
                                name={"email"}
                                value={email}
                                type={"email"}
                                onChange={handleEmailChange}
                                required
                                autoComplete={"off"}
                            />
                            <CustomInput
                                label={"Password"}
                                name={"password"}
                                value={password}
                                type={passwordHidden ? "password" : "text"}
                                onChange={handlePasswordChange}
                                required
                                autoComplete={"off"}
                                text={
                                    passwordHidden ? (
                                        <Icon path={mdiEye} size={1} />
                                    ) : (
                                        <Icon path={mdiEyeOff} size={1} />
                                    )
                                }
                                onClick={hidePassword}
                            />
                            {showReferral ? (
                                <CustomInput
                                    label={"Referral (optional)"}
                                    name={"referral"}
                                    value={referral}
                                    type={"text"}
                                    onChange={handleReferralChange}
                                    autoComplete={"off"}
                                />
                            ) : (
                                <ReferralContainer>
                                    <PTextMin>I have a referral code</PTextMin>
                                    <Input
                                        type={"checkbox"}
                                        checked={showReferral}
                                        name={"checkbox"}
                                        onChange={handleCheckboxChange}
                                    />
                                </ReferralContainer>
                            )}
                            <ReferralContainer>
                                <PTextMin>
                                    By registering, you accept our
                                    <CustomTerms
                                        href="https://wapupay.com/terms-and-conditions/"
                                        target="_blank"
                                    >
                                        Term of Use
                                    </CustomTerms>
                                    and
                                    <CustomTerms
                                        href="https://wapupay.com/privacy-policy/"
                                        target="_blank"
                                    >
                                        Privacy Policy
                                    </CustomTerms>
                                    .
                                </PTextMin>
                                <Input
                                    type={"checkbox"}
                                    checked={checkTerms}
                                    name={"checkbox"}
                                    onChange={() => setcheckTerms(!checkTerms)}
                                />
                            </ReferralContainer>
                        </InputContainer>
                        <ButtonRequest
                            onClick={handleSubmit}
                            text="Create account"
                            isDisabled={checkTerms ? false : true}
                        />
                    </SignupForm>
                </ModalContainer>
            </CustomModal>
            <ErrorModal
                message={errorMessage}
                state={errorModalState}
                errorModalOnRequestClose={() => setErrorModalState(false)}
            />
        </RegisterContainer>
    );
}

export default SignUp;
