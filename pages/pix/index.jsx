"use client";
import QRCode from "qrcode.react";
import { useState, useEffect } from "react";
import {
    Container,
    InputContainer,
    Form,
    CustomIcon,
    CustomTitle,
    ContainerConfirm,
    ButtonContainer,
    QRContainer,
    CopyButton,
    PText,
    PTextMin,
    TextContainer,
    ContainerX,
    ContainerY,
} from "./styled";
import { Button } from "../../components/Button";
import { ButtonRequest } from "../../components/ButtonRequest";
import ErrorModal from "../../components/ErrorModal";
import { CustomInput } from "../../components/Input";
import CopyIcon from "../../public/icons/content_copy_FILL0_wght400_GRAD0_opsz24.svg";
import { CustomInputReadOnly } from "../../components/InputReadOnly";
import { useUserContext } from "../../context/userContext";
import { useRouter } from "next/router";
import { isValidAmount } from "../../utils/validations";
import { sendPix } from "../../api/api";

function calculateUsdtAmount(amount, rateUsdtBrlSell, pixDepositFee) {
    const usdtAmount = (amount / rateUsdtBrlSell) * (1 - pixDepositFee);
    return usdtAmount.toFixed(2);
}

export default function Pix() {
    const [amount, setAmount] = useState("");
    const [showConfirmScreen, setShowConfirmScreen] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorModalState, setErrorModalState] = useState(false);
    const [showWallet, setShowWallet] = useState(false);
    const [showDepositPix, setShowDepositPix] = useState(true);
    const [confirmationMessage, setConfirmationMessage] = useState(
        "It will take up to 2 hours to process"
    );
    const [image, setImage] = useState(null);
    const { user, setIsOpen } = useUserContext();
    const router = useRouter();

    useEffect(() => {
        setIsOpen(false);
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    const handleAmountChange = (e) => {
        if (isValidAmount(e.target.value)) {
            setAmount(e.target.value);
        }
    };

    const getAmount = () => {
        if (amount < user.minPixDepositBrl) {
            setErrorMessage("The minimum amount is R" + user.minPixDepositBrl);
            setErrorModalState(true);
        } else {
            setShowDepositPix(false);
            setShowWallet(true);
        }
    };

    const toConfirmPage = () => {
        if (image !== null) {
            setShowConfirmScreen(true);
            setShowWallet(false);
        }
        if (image === null) {
            setErrorMessage("We need the receipt to proceed");
            setErrorModalState(true);
        }
    };

    const handleSendPix = async () => {
        const payload = {
            amount: amount,
            currency: "BRL",
            image: image,
        };

        try {
            const { data, status } = await sendPix(payload);

            if (status >= 200 && status < 300) {
                setShowConfirmScreen(false);
                router.push(
                    `/transactionComplete?message=${confirmationMessage}&trx_id=${data.transaction_id}`
                );
            } else if (status === 400) {
                setErrorMessage(data.error);
                setErrorModalState(true);
            }
        } catch (error) {
            console.log("Error while sending PIX:", error);
        }
    };

    const formattedUsdtAmount = calculateUsdtAmount(
        amount,
        user.rateUsdtBrlSell,
        user.pixDepositFee
    );

    return (
        <>
            <ErrorModal
                message={errorMessage}
                state={errorModalState}
                errorModalOnRequestClose={() => setErrorModalState(false)}
            />
            {/* Deposit page */}
            {showDepositPix && (
                <Container>
                    <CustomTitle>PIX Deposit</CustomTitle>
                    <Form>
                        <InputContainer>
                            <CustomInput
                                label={"Amount in Reals"}
                                name={"amount"}
                                value={amount}
                                onChange={handleAmountChange}
                                required
                                autoComplete={"off"}
                            />
                        </InputContainer>
                        {typeof amount !== "undefined" ? (
                            <PText>You get: {formattedUsdtAmount} USDT</PText>
                        ) : (
                            <PTextMin>...</PTextMin>
                        )}
                        {typeof user.minPixDepositBrl !== "undefined" ? (
                            <PTextMin>
                                <PTextMin>
                                    Minimun deposit amount:{" "}
                                    {user.minPixDepositBrl} R$
                                </PTextMin>
                                <PTextMin>
                                    Deposit fee: {user.pixDepositFee * 100} %
                                </PTextMin>
                                <PTextMin>
                                    Exchange rate: {user.rateUsdtBrlSell} R$ = 1
                                    USDT
                                </PTextMin>
                            </PTextMin>
                        ) : (
                            <PTextMin>...</PTextMin>
                        )}
                        <PTextMin>
                            It takes up to 24hs to confirm the deposit on week
                            days
                        </PTextMin>
                    </Form>
                    <ButtonContainer>
                        <Button
                            type="submit"
                            text="Continue"
                            onClick={getAmount}
                        />
                    </ButtonContainer>
                </Container>
            )}
            {/* Scan QR page */}
            {showWallet && (
                <Container>
                    <CustomTitle>Pix</CustomTitle>
                    <QRContainer>
                        <QRCode value={user.pixKey} />
                    </QRContainer>
                    <ContainerY>
                        <Form>
                            <InputContainer>
                                <CustomInputReadOnly
                                    label="Wallet Pix"
                                    name="Pix"
                                    type="text"
                                    autoComplete="off"
                                    value={user.pixKey}
                                />
                                <CopyButton
                                    onClick={(e) => {
                                        e.preventDefault(),
                                            navigator.clipboard.writeText(
                                                user.pixKey
                                            );
                                    }}
                                >
                                    <CustomIcon
                                        width={22}
                                        height={22}
                                        src={CopyIcon}
                                        alt="Copy to clipboard"
                                    />
                                </CopyButton>
                            </InputContainer>
                        </Form>
                        <ContainerX>
                            {image ? (
                                <PText>
                                    The file got charged succesfully!{" "}
                                </PText>
                            ) : (
                                <PText>
                                    Add the receipt once you send the money
                                </PText>
                            )}
                        </ContainerX>
                        <CustomInput
                            type="file"
                            accept="image/*, application/pdf" // Define los tipos de archivos que se pueden seleccionar
                            title="Add the image"
                            onChange={handleImageChange}
                        />
                    </ContainerY>
                    <PTextMin>
                        * Ensure you are sending the money to the correct place.
                        We can't recover the funds if are sent to a wrong
                        account.
                    </PTextMin>
                    <ButtonContainer>
                        <Button text="Confirm" onClick={toConfirmPage}></Button>
                    </ButtonContainer>
                </Container>
            )}
            {/* Confirm page */}
            {showConfirmScreen && (
                <ContainerConfirm>
                    <CustomTitle>Have you sent the money?</CustomTitle>
                    <TextContainer>
                        <PText>You will send {amount} BRL</PText>
                    </TextContainer>
                    <ButtonContainer>
                        <ButtonRequest
                            onClick={handleSendPix}
                            text="Confirm"
                        ></ButtonRequest>
                    </ButtonContainer>
                </ContainerConfirm>
            )}
        </>
    );
}
