import { useState } from "react";
import CONFIG from "../../config/environment/current";
import { Button } from "../../components/Button";
import { CustomInput } from "../../components/Input";
import {
    CustomTitle,
    Form,
    RecoverPasswordContainer,
    FormContainer,
} from "./styled";
import ErrorModal from "../../components/ErrorModal";

function RecoverPassword() {
    const [recoveryEmail, setRecoveryEmail] = useState("");
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorModalState, setErrorModalState] = useState(false);

    const handleEmailChange = (e) => {
        setRecoveryEmail(e.target.value);
    };

    const handleRecoverPasswordClick = async (e) => {
        e.preventDefault();
        const response = await fetch(
            CONFIG.API.BASE_URL + "/users/send-recovery-email",
            {
                method: "POST",
                body: JSON.stringify({
                    email: recoveryEmail,
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        const data = await response.json();

        if (response.ok) {
            setErrorMessage("Recovery email password sent.");
            setErrorModalState(true);
        } else {
            setErrorMessage(data.error);
            setErrorModalState(true);
        }
    };

    return (
        <RecoverPasswordContainer>
            <CustomTitle>Reset Password</CustomTitle>
            <FormContainer>
                <Form onSubmit={handleRecoverPasswordClick}>
                    <CustomInput
                        label={"Email"}
                        name={"email"}
                        value={recoveryEmail}
                        type={"email"}
                        onChange={handleEmailChange}
                        required
                        autoComplete={"off"}
                    />
                    <Button type="submit" text="Send link" />
                </Form>
            </FormContainer>
            <ErrorModal
                message={errorMessage}
                state={errorModalState}
                errorModalOnRequestClose={() => {
                    setErrorModalState(false);
                }}
            />
        </RecoverPasswordContainer>
    );
}

export default RecoverPassword;
