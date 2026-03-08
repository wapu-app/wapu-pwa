import { useState, useEffect } from "react";
import {
    Container,
    FormContainer,
    ContainerIcon,
    ContainerButton,
    Containerinput,
    Input,
    CustomDescription,
    CustomTitle,
    UsernameContainer,
    UsernameInput,
} from "./styled";
import Icon from "@mdi/react";
import { mdiArrowLeft } from "@mdi/js";
import { useRouter } from "next/router";
import { useUserContext } from "../../context/userContext";
import { Button } from "../../components/Button";
import { CustomSelect } from "../../components/Select";
import ErrorModal from "../../components/ErrorModal";
import {
    getProfile,
    sendRecoverPasswordEmail,
    updateProfile,
    checkUsernameAvailability,
} from "../../api/api";
import Link from "next/link";

const initialState = {
    username: "",
    telegram: "",
    phone: "",
    blockchain: "",
    email: "",
    betaVersion: "",
};

export default function Profile() {
    const router = useRouter();
    const { user } = useUserContext();
    const [editable, setEditable] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorModalState, setErrorModalState] = useState(false);
    const [profile, setProfile] = useState(initialState);
    const [usernameTaken, setUsernameTaken] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profileData = await getProfile();
                setProfile({
                    username: profileData.data.username || "",
                    telegram: profileData.data.telegram || "",
                    phone: profileData.data.phone || "",
                    email: profileData.data.email || "",
                    blockchain: profileData.data.network || "",
                    betaVersion: profileData.data.beta_version || 0,
                });
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        };
        fetchProfile();
    }, []);

    const handleBack = () => {
        router.back();
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (usernameTaken) {
            setErrorMessage("Failed to update user profile");
            setErrorModalState(true);
            return;
        }

        try {
            const response = await updateProfile({
                username: profile.username,
                telegram: profile.telegram,
                phone: profile.phone,
                blockchain: profile.blockchain,
                beta_version: profile.betaVersion,
            });
            const updatedProfileData = response.data;
            setProfile({
                ...profile,
                username: updatedProfileData.username,
                telegram: updatedProfileData.telegram,
                phone: updatedProfileData.phone,
                blockchain: updatedProfileData.blockchain,
                blockchain: updatedProfileData.betaVersion,
            });

            if (response.status == 200) {
                setErrorMessage("User profile updated successfully");
            } else {
                setErrorMessage(response.data.error);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            setErrorMessage("Failed updating your profile");
        } finally {
            setErrorModalState(true);
        }
    };

    const handleRecoverPassword = async (e) => {
        e.preventDefault();
        try {
            await sendRecoverPasswordEmail(user.email);
            setErrorMessage("A link has been sent to your email");
        } catch (error) {
            console.error("Error sending recovery email:", error);
            setErrorMessage("Failed to send recovery link");
        } finally {
            setErrorModalState(true);
        }
    };

    const handleEditable = () => {
        setEditable(!editable);
    };

    const checkUsername = async (newUsername) => {
        try {
            const isUsernameAvailable = await checkUsernameAvailability(
                newUsername
            );
            setUsernameTaken(!isUsernameAvailable);
        } catch (error) {
            console.error("Error checking username availability:", error);
            setUsernameTaken(true);
        }
    };

    const handleUsernameChange = (e) => {
        const newUsername = e.target.value;
        setProfile({ ...profile, username: newUsername });

        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }

        setTypingTimeout(
            setTimeout(() => {
                checkUsername(newUsername);
            }, 1000)
        ); // Adds 1 sec of delay
    };

    const handlePhoneChange = (e) => {
        setProfile({ ...profile, phone: e.target.value });
    };

    const handleTelegramChange = (e) => {
        setProfile({ ...profile, telegram: e.target.value });
    };
    const handleBetaVersionChange = (e) => {
        setProfile({ ...profile, betaVersion: e.target.value });
    };
    return (
        <Container>
            <ErrorModal
                message={errorMessage}
                state={errorModalState}
                errorModalOnRequestClose={() => setErrorModalState(false)}
            />
            <ContainerIcon onClick={handleBack}>
                <Icon path={mdiArrowLeft} size={1.5} />
            </ContainerIcon>
            <CustomTitle>Profile</CustomTitle>
            <FormContainer>
                <Containerinput>
                    <CustomDescription>Username</CustomDescription>
                    <UsernameContainer>
                        <UsernameInput
                            type="text"
                            name="username"
                            value={profile.username}
                            onChange={handleUsernameChange}
                            readOnly={!editable}
                        />
                    </UsernameContainer>
                    {editable &&
                        (usernameTaken ? (
                            <span style={{ color: "violet" }}>
                                Username is already taken
                            </span>
                        ) : (
                            <span style={{ color: "green" }}>
                                Available username
                            </span>
                        ))}
                </Containerinput>
                <Containerinput>
                    <CustomDescription>Phone</CustomDescription>
                    <Input
                        type="text"
                        name="phone"
                        value={profile.phone}
                        onChange={handlePhoneChange}
                        readOnly={!editable}
                    />
                </Containerinput>

                <Containerinput>
                    <CustomDescription>Telegram</CustomDescription>
                    <Input
                        type="text"
                        name="telegram"
                        value={profile.telegram}
                        onChange={handleTelegramChange}
                        readOnly={!editable}
                    />
                </Containerinput>
                <Containerinput>
                    <CustomDescription>Beta version</CustomDescription>
                    <CustomSelect
                        label={"Select version"}
                        name={"beta_version"}
                        value={parseInt(profile.betaVersion)}
                        onChange={handleBetaVersionChange}
                        options={[
                            { id: 0, name: "No" },
                            { id: 1, name: "Yes" },
                        ]}
                        readOnly={!editable}
                    />
                </Containerinput>
                <ContainerButton>
                    <CustomDescription>
                        Need to change your password?
                    </CustomDescription>
                    <Link
                        href="#"
                        style={{ fontSize: "14px", color: " #b5179e" }}
                        onClick={handleRecoverPassword}
                    >
                        Click here
                    </Link>
                </ContainerButton>
            </FormContainer>
            <ContainerButton>
                <Button
                    secondary={true}
                    text={editable ? "Cancel" : "Edit"}
                    onClick={handleEditable}
                />
                <Button
                    text="Save"
                    isDisabled={!editable}
                    onClick={handleUpdateProfile}
                />
            </ContainerButton>
        </Container>
    );
}
