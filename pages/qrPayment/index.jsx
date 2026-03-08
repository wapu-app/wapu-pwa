"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import Image from "next/image";
import Webcam from "react-webcam";
import CONFIG from "../../config/environment/current";
import Modal from "react-modal";
import { CustomInput } from "../../components/Input";
import {
    Container,
    InputContainer,
    CustomTitle,
    Form,
    InfoContainer,
    ButtonContainer,
    Text,
    CenterContainer,
    CenterText,
    PTextMin,
} from "./styled";
import { Button } from "../../components/Button";
import { ButtonRequest } from "../../components/ButtonRequest";
import ErrorModal from "../../components/ErrorModal";
import HelpModal from "../../components/HelpModal";
import { useUserContext } from "../../context/userContext";
import { getAccessToken } from "../../utils/auth";
import { isValidAmount } from "../../utils/validations";
import { useRouter } from "next/router";

const QRPhoto = () => {
    const router = useRouter();

    const { helpModalState, setHelpModalState, user } = useUserContext();
    const webcamRef = useRef(null);
    const [imgSrc, setImgSrc] = useState(null);
    const [showSetAmount, setShowSetAmount] = useState(null);
    const [amount, setAmount] = useState("");
    const [QRimageUrl, setQRimageUrl] = useState("");
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorModalState, setErrorModalState] = useState(false);
    const [cameraMode, setCameraMode] = useState("environment");
    const [showCamera, setShowCamera] = useState(true);
    const [fee, setFee] = useState("");
    const [totalAmount, setTotalAmount] = useState("");
    const [showSetFee, setShowSetFee] = useState(null);
    const [errorKYCModalState, setErrorKYCModalState] = useState(false);

    useEffect(() => {
        if (CONFIG.MODE === "LOCAL") {
            setCameraMode("user");
        } else {
            setCameraMode("environment");
        }
    }, []);
    useEffect(() => {
        lastTransactionPending();
    }, []);
    const videoConstraints = {
        facingMode: { exact: cameraMode },
    };
    const handleCancelSend = () => {
        // come back to the QR view
        setShowSetAmount(false);
        setShowSetFee(false);
        setShowCamera(true);
    };
    const handleAmountChange = (e) => {
        if (isValidAmount(e.target.value)) {
            setAmount(e.target.value);
        }
    };
    useEffect(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setImgSrc(imageSrc);
        }
    }, []);

    const capture = useCallback(() => {
        if (user.qrPayment) {
            const imageSrc = webcamRef.current.getScreenshot();
            setImgSrc(imageSrc);
        } else {
            setErrorMessage("QR Payments are temporarily disabled.");
            setErrorModalState(true);
        }
    }, [webcamRef]);

    const retake = () => {
        setImgSrc(null);
    };
    Modal.setAppElement("body");
    const lastTransactionPending = () => {
        /* If last transaction it's Pending or Processing, is redirected to the processing screen.  */
        if (user.qrPending) {
            router.push(`/processing?trx_id=${user.qrPending}`);
        }
    };
    const getFee = async () => {
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
                            type: "qr_payment",
                        }),
                    }
                );
                const data = await res.json();
                setFee(data);
                setTotalAmount(data.total_amount);
                setShowSetFee(true);
                setShowSetAmount(false);
            } catch (error) {
                console.log(error.message);
            }
        } else {
            setErrorMessage("You have to enter a valid amount");
            setErrorModalState(true);
        }
    };
    const sendPhoto = async () => {
        const formData = new FormData();
        formData.append("image", dataURItoBlob(imgSrc), "photo.png");

        try {
            const accessToken = await getAccessToken();
            const response = await fetch(
                CONFIG.API.BASE_URL + "/transactions/qr",
                {
                    method: "POST",
                    body: formData,
                    headers: {
                        Authorization: "Bearer " + accessToken,
                    },
                }
            );
            const data = await response.json();

            if (response.ok) {
                setQRimageUrl(data.response.link);
                setShowSetAmount(true);
                setShowCamera(false);
            } else {
                if (response.status === 400 || response.status === 401) {
                    setErrorMessage(data.error);
                    setErrorModalState(true);
                } else {
                    setErrorMessage(
                        "There has been an error reading the QR. Please try again later or contact support"
                    );
                    setErrorModalState(true);
                }
            }
        } catch {
            setErrorMessage(
                "There has been an error reading the QR. Please try again later or contact support"
            );
            setErrorModalState(true);
        }
    };
    /* antes de enviar la transaccion se debe calcular cuanto le va a costar al usuario. y mostrarle la cuenta */

    const sendTransaction = async (linkPhoto, amount) => {
        const payload = {
            // Prepare the data that's going to be send to the BE
            payment_amount: amount,
            currency_taken: "USDT",
            type: "qr_payment",
            qr_image_url: linkPhoto,
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
            const trx = await response.json();
            if (response.status === 201) {
                // TODO: Replace window
                // router.push('/processing');
                setImgSrc(null);
                window.location.href =
                    "/processing?trx_id=" + trx.transaction_id; // We should use router.push but it's broken
            } else {
                if (response.status === 400 || response.status === 401) {
                    // To handled errors that can be showed to the user
                    setErrorMessage(trx.error);
                } else {
                    // To unhandled errors that shouldn't be showed to the user
                    setErrorMessage(
                        "We cant perform this transaction right now"
                    );
                }
                if (trx.error.includes("KYC")) {
                    setErrorKYCModalState(true);
                    setShowSetFee(false);
                    setShowSetAmount(false);
                    setShowCamera(true);
                } else {
                    setShowSetAmount(false);
                    setErrorModalState(true);
                }
            }
        } catch (error) {
            setErrorMessage(error);
            setShowSetAmount(false);
            setErrorModalState(true);
        }
    };

    const dataURItoBlob = (dataURI) => {
        const byteString = atob(dataURI.split(",")[1]);
        const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);

        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ab], { type: mimeString });
    };
    const helpModalMessage = {
        title: "Need help with QR?",
        subtitle: "Follow these steps:",
        content1:
            "1- Tell the merchant you want to pay with a MercadoPago QR. They'll let you know when to scan.",
        content2: "2- Enter the payment amount.",
        content3:
            "Note: Some merchants only accept ALIAS transfers. In that case, select 'SEND' from the main menu.",
        href: "https://wapupay.com/help/",
        text_button: "More info",
        target: "_blank",
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
            {showSetAmount && (
                <Container>
                    <CustomTitle>Pay ARS</CustomTitle>
                    <Form>
                        <InputContainer>
                            <CustomInput
                                label={"Amount"}
                                name={"amount"}
                                value={amount}
                                onChange={handleAmountChange}
                                required
                                autoComplete={"off"}
                            />
                        </InputContainer>
                    </Form>
                    <ButtonContainer>
                        <Button
                            secondary={true}
                            onClick={handleCancelSend}
                            text="Cancel"
                        />
                        <Button type="submit" onClick={getFee} text="Confirm" />
                    </ButtonContainer>
                </Container>
            )}
            {showCamera && (
                <Container>
                    <div>
                        {imgSrc ? (
                            <div
                                style={{
                                    position: "relative",
                                    width: "330px",
                                    height: "350px",
                                    top: "30px",
                                }}
                            >
                                <Image
                                    src={imgSrc}
                                    alt="webcam"
                                    layout="fill"
                                    objectFit="cover"
                                />
                            </div>
                        ) : (
                            <Webcam
                                height={350}
                                width={330}
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                screenshotQuality={0.8}
                                videoConstraints={videoConstraints}
                            />
                        )}
                    </div>
                    <div>
                        {imgSrc ? (
                            <ButtonContainer
                                style={{ position: "relative", top: "40px" }}
                            >
                                <Button
                                    secondary={true}
                                    text="Retake"
                                    onClick={retake}
                                />
                                <ButtonRequest
                                    text="Send"
                                    onClick={sendPhoto}
                                />
                            </ButtonContainer>
                        ) : (
                            <ButtonContainer>
                                <Button text="Capture QR" onClick={capture} />
                            </ButtonContainer>
                        )}
                    </div>
                </Container>
            )}
            {showSetFee && (
                <Container>
                    <CenterContainer>
                        <CustomTitle>Confirm</CustomTitle>
                        <Text>You will pay</Text>
                        <CenterText>{amount} ARS</CenterText>
                    </CenterContainer>
                    <InfoContainer>
                        <Text>Fee: {fee.fee} USDT</Text>
                        <Text>Total amount: {totalAmount.toFixed(2)} USDT</Text>
                        <Text>
                            Exchange rate: 1 USDT = {fee.exchange_rate} ARS
                        </Text>
                        <PTextMin>
                            The money will be taken from your USDT account
                        </PTextMin>
                    </InfoContainer>
                    <ButtonContainer>
                        <Button
                            secondary={true}
                            text="Cancel"
                            onClick={handleCancelSend}
                        />
                        <ButtonRequest
                            text="Confirm"
                            onClick={() => sendTransaction(QRimageUrl, amount)}
                        />
                    </ButtonContainer>
                </Container>
            )}
        </>
    );
};
export default QRPhoto;
