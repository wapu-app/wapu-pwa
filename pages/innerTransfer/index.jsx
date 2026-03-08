import { useState } from "react";
import Modal from "react-modal";
import {
    InputContainer,
    CustomTitle,
    Form,
    ButtonContainer,
    InfoContainer,
    Text,
    CenterText,
    CenterContainer,
    PTextMin,
    SendForm,
} from "./styled";
import { CustomInput } from "../../components/Input";
import { Button } from "../../components/Button";
import { ButtonRequest } from "../../components/ButtonRequest";
import ErrorModal from "../../components/ErrorModal";
import HelpModal from "../../components/HelpModal";
import { useUserContext } from "../../context/userContext";
import { useRouter } from "next/router";
import { isValidAmount } from "../../utils/validations";
import { postInnerTransfer } from "../../api/api";

function send() {
    const [amount, setAmount] = useState("");
    const [receiverUsername, setReceiverUsername] = useState("");
    const [showConfirmScreen, setShowConfirmScreen] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorModalState, setErrorModalState] = useState(false);
    const [errorKYCModalState, setErrorKYCModalState] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState(
        `${amount} USDT sent`
    );
    const { user, helpModalState, setHelpModalState } = useUserContext();

    Modal.setAppElement("body");
    const router = useRouter();

    const handleAmountChange = (e) => {
        if (isValidAmount(e.target.value)) {
            setAmount(e.target.value);
        }
    };
    const handleUsernameChange = (e) => {
        setReceiverUsername(e.target.value);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (amount > user.usdtBalance) {
            setErrorMessage("Insufficient balance");
            setErrorModalState(true);
            setShowConfirmScreen(false);
        } else {
            setShowConfirmScreen(true);
            setConfirmationMessage(
                `${amount} USDT sent to ${receiverUsername}`
            );
        }
    };
    const handleCancelSend = () => {
        setShowConfirmScreen(false);
    };

    const handleConfirmSend = async () => {
        const payload = {
            amount: amount,
            currency: "USDT",
            receiver_username: receiverUsername,
        };

        try {
            const { data, status } = await postInnerTransfer(payload);

            if (status === 200 || status === 201) {
                router.push(
                    `/transactionComplete?message=${confirmationMessage}&trx_id=${data.transaction_id}`
                );
            } else {
                throw new Error(
                    "Unexpected error. Please try again later or contact Support."
                );
            }
        } catch (error) {
            if (error.message.includes("KYC")) {
                setErrorKYCModalState(true);
                setShowConfirmScreen(false);
            } else {
                setErrorMessage(
                    error.message ||
                        "We cannot perform this transaction right now"
                );
                setShowConfirmScreen(false);
                setErrorModalState(true);
            }
        }
    };

    const whatsappMessage = `Hi i'm ${user.username}. I need to upgrade my level of the kyc.`;
    const errorModalMessage = {
        title: "Validate identity",
        subtitle: "",
        content1: errorMessage,
        content2: "",
        content3: "",
        href:
            user.kycTier === 1 || 2
                ? `https://api.whatsapp.com/send?phone=5491124060850&text=${encodeURIComponent(
                      whatsappMessage
                  )}`
                : "/kycPersonData",
        text_button: user.kycTier === 1 || 2 ? "Support" : "Start KYC",
    };
    const helpModalMessage = {
        title: "Do you want to send money to other Wapu user?",
        subtitle: "Follow these steps:",
        content1:
            "1- Ask the recipient for his Wapu username. It is in the home screen.",
        content2: "2- Write the amount in dolars that you want to send.",
        content3: "",
        href: "https://wapupay.com/help/",
        text_button: "More info",
        target: "_blank",
    };
    const maxAmount = () => {
        const maxAmount = user.usdtBalance;
        setAmount(maxAmount.toFixed(2));
    };

    return (
        <>
            <ErrorModal
                message={errorMessage}
                state={errorModalState}
                errorModalOnRequestClose={() => setErrorModalState(false)}
            />
            <HelpModal
                message={errorModalMessage}
                state={errorKYCModalState}
                helpModalOnRequestClose={() => setErrorKYCModalState(false)}
            />
            <HelpModal
                message={helpModalMessage}
                state={helpModalState}
                helpModalOnRequestClose={() => setHelpModalState(false)}
            />
            <SendForm>
                {showConfirmScreen ? (
                    //add styles to div
                    <>
                        <CustomTitle>Confirm</CustomTitle>
                        <CenterContainer>
                            <Text>You will send </Text>
                            <CenterText>{amount} USDT</CenterText>
                        </CenterContainer>
                        <InfoContainer>
                            <Text>To: {receiverUsername}</Text>
                            <Text>Fee: 0 USDT</Text>
                            <Text>Total amount: {amount} USDT</Text>
                            <PTextMin>
                                The money will be taken from your USDT account
                            </PTextMin>
                        </InfoContainer>
                        <ButtonContainer>
                            <Button
                                secondary={true}
                                onClick={handleCancelSend}
                                text="Cancel"
                            />
                            <ButtonRequest
                                onClick={handleConfirmSend}
                                text="Confirm"
                            />
                        </ButtonContainer>
                    </>
                ) : (
                    <>
                        <CustomTitle>Send USDT</CustomTitle>
                        <Form onSubmit={handleSend}>
                            <InputContainer>
                                <CustomInput
                                    label={"Amount *"}
                                    name={"amount"}
                                    value={amount}
                                    onChange={handleAmountChange}
                                    required
                                    autoComplete={"off"}
                                    text={"MAX"}
                                    onClick={maxAmount}
                                />
                                <CustomInput
                                    name={"receiverUsername"}
                                    type={"text"}
                                    label={"Receiver Wapu username *"}
                                    value={receiverUsername}
                                    onChange={handleUsernameChange}
                                    required
                                    autoComplete="off"
                                />
                            </InputContainer>
                        </Form>
                        <ButtonContainer>
                            <Button
                                type="submit"
                                text="Continue"
                                onClick={handleSend}
                            />
                        </ButtonContainer>
                    </>
                )}
            </SendForm>
        </>
    );
}

export default send;
