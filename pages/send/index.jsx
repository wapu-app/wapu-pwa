import CONFIG from "../../config/environment/current";
import { useEffect, useState } from "react";
import Modal from "react-modal";
import {
    InputContainer,
    CustomTitle,
    Form,
    FormContainer,
    ButtonContainer,
    InfoContainer,
    Text,
    ContainerSend,
    CenterText,
    CenterContainer,
    PTextMin,
    SendForm,
    ContainerY,
} from "./styled";
import { CustomInput } from "../../components/Input";
import { Button } from "../../components/Button";
import { ButtonRequest } from "../../components/ButtonRequest";
import ErrorModal from "../../components/ErrorModal";
import HelpModal from "../../components/HelpModal";
import { useUserContext } from "../../context/userContext";
import { useRouter } from "next/router";
import { getAccessToken } from "../../utils/auth";
import { isValidAmount } from "../../utils/validations";

function send() {
    const [amount, setAmount] = useState("");
    const [alias, setAlias] = useState("");
    const [receiver_name, setName] = useState("");
    const [showConfirmScreen, setShowConfirmScreen] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorModalState, setErrorModalState] = useState(false);
    const [errorKYCModalState, setErrorKYCModalState] = useState(false);
    const [tentativeAmount, setTentativeAmount] = useState("");
    const [confirmationMessage, setConfirmationMessage] = useState("");
    const { user, helpModalState, setHelpModalState } = useUserContext();
    const [transactionType, setTransactionType] = useState("");
    const [fee, setFee] = useState("");
    Modal.setAppElement("body");
    const router = useRouter();
    const { mode } = router.query;

    useEffect(() => {
        if (
            typeof mode !== "undefined" &&
            typeof user.fiatTransferFee !== "undefined"
        ) {
            if (mode == "fast") {
                setConfirmationMessage("Up to 2 hours to complete");
                setTransactionType("fast_fiat_transfer");
                setFee(user.fastFiatTransferFee);
            } else if (mode == "regular") {
                setConfirmationMessage("Up to 24 hours to complete");
                setTransactionType("fiat_transfer");
                setFee(user.fiatTransferFee);
            }
        }
    }, [mode, user]);
    const handleAmountChange = (e) => {
        if (isValidAmount(e.target.value)) {
            setAmount(e.target.value);
        }
    };
    const handleAliasChange = (e) => {
        setAlias(e.target.value);
    };
    const handleReceiverNameChange = (e) => {
        setName(e.target.value);
    };

    const handleSendARS = async (e) => {
        /* if the amount is greater than balance, we show error modal */
        if (amount > user.combinedBalance) {
            e.preventDefault();
            setErrorMessage("Insufficient balance");
            setErrorModalState(true);
            setShowConfirmScreen(false);
        } else {
            e.preventDefault();
            getTentativeAmount();
            setShowConfirmScreen(true); // muestra la pantalla de confirmación
        }
    };
    const handleCancelSend = () => {
        // vuelve a la vista del formulario
        setShowConfirmScreen(false);
    };
    const getTentativeAmount = async () => {
        if (amount) {
            try {
                const accessToken = await getAccessToken();
                const res = await fetch(
                    CONFIG.API.BASE_URL + "/transactions/tentative-amount",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*",
                            Authorization: "Bearer " + accessToken,
                        },
                        body: JSON.stringify({
                            amount: amount,
                            currency_payment: "ARS",
                            currency_taken: "USDT",
                            type: transactionType,
                        }),
                    }
                );
                const data = await res.json();
                setTentativeAmount(data);
            } catch (error) {
                console.log(error.message);
            }
        } else {
        }
    };

    const handleConfirmSend = async () => {
        const payload = {
            // Prepare the data that's going to be send to the BE
            payment_amount: amount,
            currency_taken: "USDT",
            type: transactionType,
            alias: alias,
            receiver_name: receiver_name,
        };
        const formData = new FormData();
        Object.keys(payload).forEach((key) =>
            formData.append(key, payload[key])
        ); // Turn this in FormData type

        try {
            const accessToken = await getAccessToken();
            const response = await fetch(
                CONFIG.API.BASE_URL + "/transactions/create",
                {
                    method: "POST",
                    headers: {
                        // It doesn't have the "Content-Type" on porpouse, it should recognise the FormData
                        "Access-Control-Allow-Origin": "*",
                        Authorization: "Bearer " + accessToken,
                    },
                    body: formData,
                }
            );
            const data = await response.json();
            if (response.status === 201) {
                router.push(
                    `/transactionComplete?message=${confirmationMessage}&trx_id=${data.transaction_id}`
                );
            } else {
                if (response.status === 400 || response.status === 401) {
                    // To handled errors that can be showed to the user
                    setErrorMessage(data.error);
                } else {
                    // To unhandled errors that shouldn't be showed to the user
                    setErrorMessage(
                        "We cant perform this transaction right now"
                    );
                }
                if (data.error.includes("KYC")) {
                    setErrorKYCModalState(true);
                    setShowConfirmScreen(false);
                } else {
                    setShowConfirmScreen(false);
                    setErrorModalState(true);
                }
            }
        } catch (error) {
            setErrorMessage(error);
            setShowConfirmScreen(false);
            setErrorModalState(true);
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
        title: "Do you need help sending money?",
        subtitle: "Follow these steps:",
        content1:
            "1- Tell the recipient you can transfer Argentine pesos, including via MercadoPago.",
        content2:
            "2- Ask for their ALIAS, CBU or CVU (either works as they identify the bank account).",
        content3:
            "If you have the account holder or business name, it's helpful, but optional.",
        href: "https://wapupay.com/help/",
        text_button: "More info",
        target: "_blank",
    };
    const maxAmount = () => {
        if (fee !== "") {
            let result = Math.floor(
                user.usdtBalance * (1 - fee) * user.rateUsdtArsBuy
            );
            setAmount(result);
        }
    };
    /* falta obtener el amount del user y que al hacer click en MAX se tome todo el amount para enviar.  */
    const formatCurrency = (amount, locale = "en-US", currency = "USD") => {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: currency,
        }).format(amount);
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
                    <ContainerSend>
                        <CustomTitle>Confirm</CustomTitle>
                        <CenterContainer>
                            <Text>You will send </Text>
                            <CenterText>{amount} ARS</CenterText>
                        </CenterContainer>
                        <InfoContainer>
                            <Text>To: {receiver_name}</Text>
                            <Text>Account Alias/CBU: {alias}</Text>
                            <Text>
                                USDT amount: {tentativeAmount.usdt_amount}
                            </Text>
                            <Text>Fee: {tentativeAmount.fee} USDT</Text>
                            <Text>
                                Total amount: {tentativeAmount.total_amount}{" "}
                                USDT
                            </Text>
                            <Text>
                                Exchange rate: 1 USDT ={" "}
                                {tentativeAmount.exchange_rate} ARS
                            </Text>
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
                    </ContainerSend>
                ) : (
                    <FormContainer>
                        <CustomTitle>Send ARS</CustomTitle>
                        <ContainerY>
                            <Form onSubmit={handleSendARS}>
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
                                        name={"alias"}
                                        type={"text"}
                                        label={"Alias/CBU *"}
                                        value={alias}
                                        onChange={handleAliasChange}
                                        required
                                        autoComplete="off"
                                    />
                                    <CustomInput
                                        label={"Receiver full name (optional)"}
                                        name={"receiver_name"}
                                        type={"text"}
                                        value={receiver_name}
                                        onChange={handleReceiverNameChange}
                                        required
                                        autoComplete={"off"}
                                    />
                                </InputContainer>
                            </Form>
                        </ContainerY>
                        <ButtonContainer>
                            <Button
                                type="submit"
                                text="Continue"
                                onClick={handleSendARS}
                            />
                        </ButtonContainer>
                    </FormContainer>
                )}
            </SendForm>
        </>
    );
}

export default send;
