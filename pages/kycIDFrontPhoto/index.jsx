import React, { useCallback, useRef, useState, useEffect } from "react";
import Image from "next/image";
import Webcam from "react-webcam";
import CONFIG from "../../config/environment/current";
import { useRouter } from "next/navigation";
import {
    CustomTitle,
    ButtonContainer,
    CustomDescription,
    ImgContainer,
    WebcamContainer,
    InputContainer,
    Container,
    CenterContainer,
} from "./styled";
import { Button } from "../../components/Button";
import { ButtonRequest } from "../../components/ButtonRequest";
import ErrorModal from "../../components/ErrorModal";
import FileUpload from "../../components/FileUpload";
import { getUserData, uploadKycFrontPhoto } from "../../api/api";

const kycIDFrontPhoto = () => {
    const webcamRef = useRef(null);
    const [imgSrc, setImgSrc] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorModalState, setErrorModalState] = useState(false);
    const [cameraMode, setCameraMode] = useState("environment");
    const [userData, setUserData] = useState(null);
    const [takePhoto, setTakePhoto] = useState(true);

    const router = useRouter();

    useEffect(() => {
        if (CONFIG.MODE === "LOCAL") {
            setCameraMode("user");
        } else {
            setCameraMode("environment");
        }

        const loadUserData = async () => {
            try {
                const { data, status } = await getUserData();

                if (status === 200) {
                    setUserData(data);
                } else {
                    if (status === 400 || status === 401) {
                        setErrorMessage(
                            data.message || "Failed to fetch user data."
                        );
                    } else {
                        setErrorMessage(
                            "There has been a problem. Please try again later or contact support."
                        );
                    }
                    setErrorModalState(true);
                }
            } catch (error) {
                setErrorMessage(error.message);
                setErrorModalState(true);
            }
        };

        loadUserData();
    }, []);

    const videoConstraints = {
        facingMode: { exact: cameraMode },
    };

    useEffect(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setImgSrc(imageSrc);
        }
    }, []);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImgSrc(imageSrc);
    }, [webcamRef]);

    const retake = () => {
        setImgSrc(null);
    };

    const sendPhoto = async () => {
        try {
            const { data, status } = await uploadKycFrontPhoto(imgSrc);

            if (status === 200 || status === 201) {
                if (userData.credential_type.toLowerCase() === "passport") {
                    router.push("/kycFacePhoto");
                } else {
                    router.push("/kycIDBackPhoto");
                }
            } else {
                if (status === 400 || status === 401) {
                    setErrorMessage(data.error);
                } else {
                    setErrorMessage(
                        "There has been a problem. Please try again later or contact support"
                    );
                }
                setErrorModalState(true);
            }
        } catch (error) {
            setErrorMessage(error.message);
            setErrorModalState(true);
        }
    };

    return (
        <>
            <ErrorModal
                message={errorMessage}
                state={errorModalState}
                errorModalOnRequestClose={() => setErrorModalState(false)}
            />
            <Container>
                <CustomTitle>Passport / ID card front</CustomTitle>
                {imgSrc ? (
                    <Container>
                        <ImgContainer>
                            <Image
                                src={imgSrc}
                                alt="webcam"
                                layout="fill"
                                objectFit="scale-down"
                            />
                        </ImgContainer>
                        <ButtonContainer>
                            <Button
                                secondary={true}
                                text="Retake"
                                onClick={retake}
                            />
                            <ButtonRequest text="Send" onClick={sendPhoto} />
                        </ButtonContainer>
                    </Container>
                ) : (
                    <Container>
                        {takePhoto ? (
                            <WebcamContainer>
                                <Webcam
                                    height={350}
                                    width={330}
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    screenshotQuality={0.8}
                                    videoConstraints={videoConstraints}
                                />
                                <ButtonContainer>
                                    <Button
                                        secondary={true}
                                        text="Select from gallery"
                                        onClick={() => {
                                            setTakePhoto(false);
                                        }}
                                    />
                                    <Button text="Capture" onClick={capture} />
                                </ButtonContainer>
                            </WebcamContainer>
                        ) : (
                            <CenterContainer>
                                <InputContainer>
                                    <FileUpload fileSetter={setImgSrc} />
                                </InputContainer>
                                <ButtonContainer>
                                    <Button
                                        secondary={true}
                                        text="Use Camera"
                                        onClick={() => {
                                            setTakePhoto(true);
                                        }}
                                    />
                                </ButtonContainer>
                            </CenterContainer>
                        )}
                    </Container>
                )}
                <CustomDescription>
                    Take a photo of your passport/ID front information, or
                    upload it from storage.
                </CustomDescription>
                <CustomDescription>
                    * It should be a valid government-issued identity document.
                </CustomDescription>
            </Container>
        </>
    );
};

export default kycIDFrontPhoto;
