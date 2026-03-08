import Modal from "react-modal";
import { useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import { Button } from "../../components/Button";
import { CustomInput } from "../../components/Input";
import { createLog } from "../../utils/createLog";
import useUserAgent from "../../hooks/userAgent";
import ErrorModal from "../../components/ErrorModal";
import Icon from "@mdi/react";
import { mdiEyeOff, mdiEye } from "@mdi/js";
import {
    InputContainer,
    CustomTitle,
    Form,
    LoginContainer,
    ModalContainer,
    CustomModal,
    customStyles,
    CustomText,
    CustomLabel,
    CustomLink,
} from "./styled";
import { ButtonRequest } from "../ButtonRequest";
import { loginUser } from "../../api/api";

function Login() {
    Cookies.set("isLoggedIn", "false", { path: "/", sameSite: "strict" });

    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorModalState, setErrorModalState] = useState(false);
    const [passwordHidden, setPasswordHidden] = useState(true);
    const { userAgent, isIOS, isStandalone, isMobile } = useUserAgent();
    const router = useRouter();

    const hidePassword = () => {
        setPasswordHidden((prevState) => !prevState);
    };

    Modal.setAppElement("body");

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handleSignIn = async () => {
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

            await createLog(userAgent, isIOS, isStandalone, isMobile, "login", {
                email: email,
            });
            router.push("/home");
        } catch (error) {
            setErrorMessage(error.message || "An unexpected error occurred");
            setErrorModalState(true);

            await createLog(userAgent, isIOS, isStandalone, isMobile, "login", {
                email: email,
                errorMessage: error.message || "An unexpected error occurred",
                errorModalState: true,
            });
        }
    };

    const loginProcess = (e) => {
        e.preventDefault();
        handleSignIn();
    };

    return (
        <>
            <LoginContainer>
                <Button
                    text="Login"
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
                        message={errorMessage}
                        state={errorModalState}
                        errorModalOnRequestClose={() =>
                            setErrorModalState(false)
                        }
                    />
                    <ModalContainer>
                        <CustomTitle>Login</CustomTitle>
                        <Form onSubmit={loginProcess}>
                            <InputContainer>
                                <CustomInput
                                    label={"Email"}
                                    name={"email"}
                                    value={email}
                                    onChange={handleEmailChange}
                                    required
                                    autoComplete={"off"}
                                />
                                <CustomInput
                                    type={passwordHidden ? "password" : "text"}
                                    label={"Password"}
                                    name={"password"}
                                    value={password}
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
                                <CustomText>
                                    <CustomLabel>
                                        Forgot your password?{" "}
                                    </CustomLabel>
                                    <CustomLink href="/recoverPassword">
                                        Recover Password
                                    </CustomLink>
                                </CustomText>
                            </InputContainer>
                            <ButtonRequest
                                onClick={loginProcess}
                                text={"Login"}
                            />
                        </Form>
                    </ModalContainer>
                </CustomModal>
            </LoginContainer>
        </>
    );
}

export default Login;
