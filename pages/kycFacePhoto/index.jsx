import { useCallback, useRef, useState, useEffect } from "react";
import Image from "next/image";
import Webcam from "react-webcam";
import { useRouter } from "next/navigation";
import {
    CustomTitle,
    ButtonContainer,
    CustomDescription,
    ImgContainer,
    WebcamContainer,
    Container,
    InputContainer,
    GeneralContainer,
    CenterContainer,
} from "./styled";
import { Button } from "../../components/Button";
import { ButtonRequest } from "../../components/ButtonRequest";
import ErrorModal from "../../components/ErrorModal";
import FileUpload from "../../components/FileUpload";
import selfieWithId from "./selfie-with-id.jpg";
import { uploadKycFacePhoto } from "../../api/api";

const kycPhoto = () => {
    const webcamRef = useRef(null);
    const [imgSrc, setImgSrc] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorModalState, setErrorModalState] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);
    const [takePhoto, setTakePhoto] = useState(true);

    const router = useRouter();

    const videoConstraints = {
        facingMode: { exact: "user" },
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
        const { data, status } = await uploadKycFacePhoto(imgSrc);
        if (status === 200) {
            router.push("/kycCompleted");
        } else {
            if (status === 400 || status === 401) {
                setErrorMessage(data.error);
            } else {
                setErrorMessage("Something went wrong, please try again later");
            }
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
            {showInstructions ? (
                <Container>
                    <CustomTitle>Instructions</CustomTitle>
                    <ImgContainer>
                        <Image
                            src={selfieWithId}
                            alt="Selfie with ID"
                            style={{
                                position: "relative",
                                width: "330px",
                                height: "350px",
                            }}
                        />
                    </ImgContainer>
                    <CustomDescription>
                        Please take a selfie holding your ID card.
                    </CustomDescription>
                    <ButtonContainer>
                        <Button
                            text="Continue"
                            onClick={() => setShowInstructions(false)}
                        />
                    </ButtonContainer>
                </Container>
            ) : (
                <GeneralContainer>
                    <CustomTitle>Take a selfie + ID card</CustomTitle>
                    {imgSrc ? (
                        <GeneralContainer>
                            <ImgContainer>
                                <Image
                                    src={imgSrc}
                                    alt="webcam"
                                    layout="fill"
                                    objectFit="scale-down"
                                />
                            </ImgContainer>
                            <ButtonContainer>
                                <Button text="Retake" onClick={retake} />
                                <ButtonRequest
                                    text="Send"
                                    onClick={sendPhoto}
                                />
                            </ButtonContainer>
                        </GeneralContainer>
                    ) : (
                        <GeneralContainer>
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
                                            text="Capture"
                                            onClick={capture}
                                        />
                                        <Button
                                            text="Select from gallery"
                                            onClick={() => {
                                                setTakePhoto(false);
                                            }}
                                        />
                                    </ButtonContainer>
                                </WebcamContainer>
                            ) : (
                                <CenterContainer>
                                    <InputContainer>
                                        <FileUpload fileSetter={setImgSrc} />
                                    </InputContainer>
                                    <ButtonContainer>
                                        <Button
                                            text="Use Camera"
                                            onClick={() => {
                                                setTakePhoto(true);
                                            }}
                                        />
                                    </ButtonContainer>
                                </CenterContainer>
                            )}
                        </GeneralContainer>
                    )}
                    <CustomDescription>
                        Please take a selfie holding your ID card.
                    </CustomDescription>
                    <CustomDescription>
                        Do not wear glasses, hats, or any other items that might
                        obstruct your face.
                    </CustomDescription>
                </GeneralContainer>
            )}
        </>
    );
};

export default kycPhoto;
