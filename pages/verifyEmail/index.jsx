import { Button } from "../../components/Button";
import {
    CustomContainer,
    CustomText,
    CustomTitle,
    CenterContainer,
    ButtonContainer,
    CustomModal,
    ModalContainer,
    Form,
    customStyles,
} from "./styled";
import { CustomInput } from "../../components/Input";
import ErrorModal from "../../components/ErrorModal";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { getVerifyCode, sendVerificationEmail } from "../../api/api";

export default function verifyEmail() {
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [message, setMessage] = useState(null);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorModalState, setErrorModalState] = useState(false);
    const [verificationSent, setVerificationSent] = useState(true);

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const router = useRouter();

    useEffect(() => {
        const verifyCode = async (code) => {
            const response = await getVerifyCode(code);
            console.log("data:", response);
            if (response.status == "200") {
                setVerificationStatus(true);
                setMessage("Email verification complete!");
            } else {
                setVerificationStatus(false);
                setMessage(
                    response.data.error
                        ? response.data.error
                        : "There has been an error. Please try again or contact support."
                );
            }
            
        };

        if (router.asPath !== router.route) {
            if (typeof router.query.code !== "undefined") {
                verifyCode(router.query.code);
            } else {
                setVerificationStatus(false);
                setMessage(
                    "There has been an error. Please try again or contact support."
                );
            }
        } else {
            setVerificationStatus(false);
            setMessage(
                "There has been an error. Please try again or contact support."
            );
        }
    }, [router]);

    const backHome = () => {
        router.push("/oldHome");
    };

    const sendVerificationCode = async (e) => {
        e.preventDefault();
        const response = await sendVerificationEmail(email)
        if (response.status == 200) {
            setErrorMessage(
                "Verification link sent to the email. Please check your inbox."
            );
            setVerificationSent(true);
        } else {
            console.log("error ")
            if (response.status === 400) {
                const data = await response.data;
                setErrorMessage(data.error);
            } else {
                setErrorMessage("Please try again later or contact support");
            }
            setVerificationSent(false);
        }
        setErrorModalState(true);
    };

    const handleCloseErrorModal = () => {
        setErrorModalState(false);
        if (verificationSent) {
            router.push("/oldHome");
        }
    };

    return (
        <CustomContainer>
            <CustomModal
                isOpen={modalIsOpen}
                onRequestClose={() => setModalIsOpen(false)}
                style={customStyles}
            >
                <CustomTitle>Verify Email</CustomTitle>
                <ModalContainer>
                    <Form onSubmit={sendVerificationCode}>
                        <CustomInput
                            label={"Email"}
                            name={"email"}
                            value={email}
                            type={"email"}
                            onChange={handleEmailChange}
                            required
                            autoComplete={"off"}
                        />
                        <Button type="submit" text="Send verification code" />
                    </Form>
                </ModalContainer>
            </CustomModal>

            <CustomTitle>Email Verification</CustomTitle>
            <CenterContainer>
                <CustomText>{message}</CustomText>
            </CenterContainer>
            {verificationStatus ? (
                <ButtonContainer>
                    <Button text="Home" onClick={backHome} />
                </ButtonContainer>
            ) : (
                <ButtonContainer>
                    <Button
                        text="Send new verification code"
                        onClick={() => setModalIsOpen(true)}
                    />
                </ButtonContainer>
            )}
            <ErrorModal
                message={errorMessage}
                state={errorModalState}
                errorModalOnRequestClose={handleCloseErrorModal}
            />
        </CustomContainer>
    );
}
