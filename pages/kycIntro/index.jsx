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
    ButtonsContainer,
    WebcamContainer,
} from "./styled";
import { Button } from "../../components/Button";
import ErrorModal from "../../components/ErrorModal";
import { getAccessToken } from "../../utils/auth";
import { uploadKycFacePhoto } from "../../api/api";

const kycPhoto = () => {
    const webcamRef = useRef(null);
    const [imgSrc, setImgSrc] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorModalState, setErrorModalState] = useState(false);
    const [cameraMode, setCameraMode] = useState("environment");

    const router = useRouter();

    useEffect(() => {
        if (CONFIG.MODE === "LOCAL") {
            setCameraMode("user");
        } else {
            setCameraMode("environment");
        }
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

    const handleSendPhoto = async () => {
        try {
            await uploadKycFacePhoto(imgSrc);
            router.push("/kycForm");
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
            <WebcamContainer>
                <CustomTitle>Take a picture of your face</CustomTitle>
                <ImgContainer>
                    {imgSrc ? (
                        <Image
                            src={imgSrc}
                            alt="webcam"
                            height={350}
                            width={330}
                        />
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
                </ImgContainer>
                <ButtonsContainer>
                    {imgSrc ? (
                        <ButtonContainer>
                            <Button text="Retake" onClick={retake} />
                            <Button text="Send" onClick={handleSendPhoto} />
                        </ButtonContainer>
                    ) : (
                        <ButtonContainer>
                            <Button text="Take photo" onClick={capture} />
                        </ButtonContainer>
                    )}
                </ButtonsContainer>
                <CustomDescription>Take a photo of your face</CustomDescription>
                <CustomDescription>
                    * Be prepared to take a selfie and make sure you are in a
                    well-lit room
                </CustomDescription>
            </WebcamContainer>
        </>
    );
};

export default kycPhoto;
