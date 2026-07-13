import { useState, useEffect } from "react";
import { YStack, XStack, Paragraph } from "tamagui";
import { useRouter } from "next/router";
import { useUserContext } from "../../context/userContext";
import TamaguiInput from "../../components/TamaguiInput";
import TamaguiButton from "../../components/TamaguiButton";
import TamaguiCheckbox from "../../components/TamaguiCheckbox";
import TamaguiLink from "../../components/TamaguiLink";
import NewHeaderButton from "../../components/newHeaderButton";
import ErrorModal from "../../components/ErrorModal";
import {
    getProfile,
    sendRecoverPasswordEmail,
    updateProfile,
    checkUsernameAvailability,
} from "../../api/api";

const initialState = {
    username: "",
    telegram: "",
    phone: "",
    blockchain: "",
    email: "",
    betaVersion: false,
};

export default function Profile() {
    const router = useRouter();
    const { user } = useUserContext();
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorModalState, setErrorModalState] = useState(false);
    const [profile, setProfile] = useState(initialState);
    const [savedProfile, setSavedProfile] = useState(initialState);
    const [usernameStatus, setUsernameStatus] = useState("idle"); // idle | checking | available | taken
    const [isSaving, setIsSaving] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profileData = await getProfile();
                const loadedProfile = {
                    username: profileData.data.username || "",
                    telegram: profileData.data.telegram || "",
                    phone: profileData.data.phone || "",
                    email: profileData.data.email || "",
                    blockchain: profileData.data.network || "",
                    betaVersion: Boolean(profileData.data.beta_version),
                };
                setProfile(loadedProfile);
                setSavedProfile(loadedProfile);
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        };
        fetchProfile();
    }, []);

    const isDirty =
        profile.username !== savedProfile.username ||
        profile.telegram !== savedProfile.telegram ||
        profile.phone !== savedProfile.phone ||
        profile.betaVersion !== savedProfile.betaVersion;

    const handleBack = () => {
        router.back();
    };

    const checkUsername = async (newUsername) => {
        try {
            const isUsernameAvailable = await checkUsernameAvailability(
                newUsername
            );
            setUsernameStatus(isUsernameAvailable ? "available" : "taken");
        } catch (error) {
            console.error("Error checking username availability:", error);
            setUsernameStatus("taken");
        }
    };

    const handleUsernameChange = (newUsername) => {
        setProfile((prev) => ({ ...prev, username: newUsername }));

        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }

        if (newUsername === savedProfile.username) {
            setUsernameStatus("idle");
            return;
        }

        setUsernameStatus("checking");
        setTypingTimeout(
            setTimeout(() => {
                checkUsername(newUsername);
            }, 1000)
        ); // Adds 1 sec of delay
    };

    const handlePhoneChange = (value) => {
        setProfile((prev) => ({ ...prev, phone: value }));
    };

    const handleTelegramChange = (value) => {
        setProfile((prev) => ({ ...prev, telegram: value }));
    };

    const handleBetaVersionToggle = () => {
        setProfile((prev) => ({ ...prev, betaVersion: !prev.betaVersion }));
    };

    const handleSave = async () => {
        if (usernameStatus === "taken") {
            setErrorMessage("Failed to update user profile");
            setErrorModalState(true);
            return;
        }

        setIsSaving(true);
        try {
            const response = await updateProfile({
                username: profile.username,
                telegram: profile.telegram,
                phone: profile.phone,
                blockchain: profile.blockchain,
                beta_version: profile.betaVersion ? "1" : "0",
            });

            if (response.status === 200) {
                const updatedProfileData = response.data;
                // PATCH /users/profile only echoes back username/telegram/phone/email;
                // blockchain and beta_version are not part of its response, so keep
                // the values we just submitted instead of overwriting them with undefined.
                const nextProfile = {
                    ...profile,
                    username: updatedProfileData.username || "",
                    telegram: updatedProfileData.telegram || "",
                    phone: updatedProfileData.phone || "",
                };
                setProfile(nextProfile);
                setSavedProfile(nextProfile);
                setErrorMessage("User profile updated successfully");
            } else {
                setErrorMessage(response.data.error);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            setErrorMessage("Failed updating your profile");
        } finally {
            setIsSaving(false);
            setErrorModalState(true);
        }
    };

    const handleRecoverPassword = async () => {
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

    const isSaveDisabled =
        !isDirty ||
        isSaving ||
        usernameStatus === "taken" ||
        usernameStatus === "checking";

    return (
        <YStack
            width={"$width100"}
            height={"$height100"}
            alignItems="center"
            backgroundColor={"$neutral1"}
        >
            <ErrorModal
                message={errorMessage}
                state={errorModalState}
                errorModalOnRequestClose={() => setErrorModalState(false)}
            />
            <YStack padding={"$4"} width={"$width100"}>
                <NewHeaderButton onClick={handleBack}>Profile</NewHeaderButton>
            </YStack>
            <YStack
                width={"$width90"}
                flex={1}
                justifyContent="space-between"
                paddingBottom={"$14"}
            >
                <YStack gap={"$5"}>
                    <YStack gap={"$2"}>
                        <TamaguiInput
                            label={"Username"}
                            value={profile.username}
                            onChange={handleUsernameChange}
                            placeholder={"Username"}
                            error={usernameStatus === "taken"}
                        />
                        {usernameStatus === "taken" && (
                            <Paragraph color={"$semanticRed"} fontSize={"$5"}>
                                Username is already taken
                            </Paragraph>
                        )}
                        {usernameStatus === "available" && (
                            <Paragraph
                                color={"$semanticGreen"}
                                fontSize={"$5"}
                            >
                                Available username
                            </Paragraph>
                        )}
                    </YStack>

                    <TamaguiInput
                        label={"Phone"}
                        value={profile.phone}
                        onChange={handlePhoneChange}
                        placeholder={"Phone"}
                    />

                    <TamaguiInput
                        label={"Telegram"}
                        value={profile.telegram}
                        onChange={handleTelegramChange}
                        placeholder={"Telegram"}
                    />

                    <TamaguiCheckbox
                        value={profile.betaVersion}
                        // TamaguiCheckbox forwards unrecognized props straight to Tamagui's
                        // Checkbox. Tamagui reads `checked` (not `value`) to render its visual
                        // state, so without this the box always paints unchecked on first load.
                        checked={profile.betaVersion}
                        onClick={handleBetaVersionToggle}
                        label={"Enable beta version"}
                    />

                    <XStack gap={"$2"} alignItems="center" flexWrap="wrap">
                        <Paragraph color={"$neutral11"} fontSize={"$4"}>
                            Need to change your password?
                        </Paragraph>
                        <TamaguiLink
                            text={"Click here"}
                            onClick={handleRecoverPassword}
                        />
                    </XStack>
                </YStack>

                <TamaguiButton
                    text={"Save"}
                    onClick={handleSave}
                    isDisabled={isSaveDisabled}
                    isLoading={isSaving}
                />
            </YStack>
        </YStack>
    );
}
