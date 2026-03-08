import Modal from "react-modal";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Button } from "../../components/Button";
import { CustomInput } from "../../components/Input";
import ErrorModal from "../../components/ErrorModal";
import {
    InputContainer,
    CustomTitle,
    Form,
    LoginContainer,
    ModalContainer,
    CustomModal,
    customStyles,
} from "./styled";
import useUserAgent from "../../hooks/userAgent";
import { loginWithTempPassword, sendLoginEmail } from "../../api/api";
import { createLog } from "../../utils/createLog";
function LoginByMagicLink({ tempPass }) {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [loginMessage, setLoginMessage] = useState(null);
    const [errorModalState, setErrorModalState] = useState(false);
    const [tempPassword, setTempPassword] = useState(tempPass || "");
    const { isMobile, isStandalone, isIOS, userAgent } = useUserAgent();
    const router = useRouter();
    Modal.setAppElement("body");

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
                router.push("/oldHome");
            } catch (error) {
                setLoginMessage(error.message);
                setErrorModalState(true);
            }
        };
        if (tempPassword !== "" && tempPassword !== null) {
            loginWithToken();
        }
    }, [tempPassword]);

    useEffect(() => {
        setTempPassword(tempPass || "");
    }, [tempPass]);

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handleSignIn = async (e) => {
        e.preventDefault();

        try {
            const response = await sendLoginEmail(email);

            if (response.status === 400 || response.status === 404) {
                throw new Error(response?.data?.error);
            }

            await sendInfoUser({ email });
            setLoginMessage("Please check your email inbox for a login link.");
        } catch (error) {
            setLoginMessage(error.message || "An unexpected error occurred");
            await sendInfoUser({
                email,
                errorMessage: error.message || "An unexpected error occurred",
                errorModalState: true,
            });
        } finally {
            setErrorModalState(true);
        }
    };

    const sendInfoUser = async (extra = {}) => {
        try {
            await createLog(
                userAgent,
                isIOS,
                isStandalone,
                isMobile,
                "login by link",
                extra
            );
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <>
            <LoginContainer>
                <Button
                    text="Login by link"
                    onClick={() => {
                        setIsOpen(true);
                    }}
                    secondary={true}
                />
                <CustomModal
                    isOpen={isOpen}
                    onRequestClose={() => setIsOpen(false)}
                    style={customStyles}
                >
                    <ErrorModal
                        message={loginMessage}
                        state={errorModalState}
                        errorModalOnRequestClose={() =>
                            setErrorModalState(false)
                        }
                    />
                    <ModalContainer>
                        <CustomTitle>Login</CustomTitle>
                        <Form onSubmit={handleSignIn}>
                            <InputContainer>
                                <CustomInput
                                    label={"Email"}
                                    name={"email"}
                                    value={email}
                                    onChange={handleEmailChange}
                                    required
                                    autoComplete={"off"}
                                />
                            </InputContainer>
                            <Button type="submit" text="Send link" />
                        </Form>
                    </ModalContainer>
                </CustomModal>
            </LoginContainer>
        </>
    );
}

export default LoginByMagicLink;
