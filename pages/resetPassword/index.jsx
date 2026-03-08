import { Button } from "../../components/Button";
import { CustomInput } from "../../components/Input";
import {
    CustomContainer,
    CustomText,
    CustomTitle,
    CenterContainer,
    ButtonContainer,
    Form,
} from "./styled";
import ErrorModal from "../../components/ErrorModal";
import CONFIG from "../../config/environment/current";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export default function resetPassword() {
    const [resetStatus, setResetStatus] = useState(true);
    const [message, setMessage] = useState(null);
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorModalState, setErrorModalState] = useState(false);
    const [emailCode, setEmailCode] = useState("");
    const [showForm, setShowForm] = useState(true);

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const router = useRouter();

    useEffect(() => {
        if (router.asPath !== router.route) {
            if (typeof router.query.code !== "undefined") {
                setEmailCode(router.query.code);
                setResetStatus(true);
                setMessage("Please write your new password");
            } else {
                setResetStatus(false);
                setMessage(
                    "There has been an error. Please try again or contact support."
                );
            }
        }
    }, [router]);

    const handleSubmitPasswordResetForm = async (e) => {
        e.preventDefault();

        if (password.length < 13) {
            setErrorMessage("Password must be at least 13 characters long.");
            setErrorModalState(true);
            return;
        }

        const response = await fetch(
            CONFIG.API.BASE_URL + "/users/password-recovery/" + emailCode,
            {
                method: "POST",
                body: JSON.stringify({
                    password: password,
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        const data = await response.json();

        if (response.ok) {
            setShowForm(false);
            setMessage("Password reset complete!");
        } else {
            setResetStatus(false);
            setErrorMessage(
                data.error
                    ? data.error
                    : "There has been an error. Please try again or contact support."
            );
            setErrorModalState(true);
        }
    };

    const backHome = () => {
        router.push("/oldHome");
    };

    const handleCloseErrorModal = () => {
        setErrorModalState(false);
    };

    return (
        <CustomContainer>
            <CustomTitle>Reset Password</CustomTitle>
            <CenterContainer>
                <CustomText>{message}</CustomText>
                {resetStatus ? (
                    <>
                        {showForm ? (
                            <>
                                <Form onSubmit={handleSubmitPasswordResetForm}>
                                    <CustomInput
                                        type={"password"}
                                        label={"Password"}
                                        name={"password"}
                                        value={password}
                                        onChange={handlePasswordChange}
                                        required
                                        autoComplete={"off"}
                                    />
                                    <Button
                                        type="submit"
                                        text="Reset password"
                                    />
                                </Form>
                            </>
                        ) : (
                            <></>
                        )}
                        <ButtonContainer>
                            <Button text="Home" onClick={backHome} />
                        </ButtonContainer>
                    </>
                ) : (
                    <CenterContainer>
                        <ButtonContainer>
                            <Button
                                text="Send new reset password email"
                                onClick={() => {
                                    router.push("/recoverPassword");
                                }}
                            />
                        </ButtonContainer>
                    </CenterContainer>
                )}
            </CenterContainer>
            <ErrorModal
                message={errorMessage}
                state={errorModalState}
                errorModalOnRequestClose={handleCloseErrorModal}
            />
        </CustomContainer>
    );
}
