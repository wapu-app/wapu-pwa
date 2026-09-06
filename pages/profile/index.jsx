import { useState, useEffect } from "react";
import { YStack, XStack, Paragraph } from "tamagui";
import { useRouter } from "next/router";
import { useUserContext } from "../../context/userContext";
import TamaguiInput from "../../components/TamaguiInput";
import TamaguiButton from "../../components/TamaguiButton";
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
    npub: "",
    blockchain: "",
    email: "",
};

export default function Profile() {
    const router = useRouter();
    const { user, getUser } = useUserContext();
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
                    npub: profileData.data.npub || "",
                    email: profileData.data.email || "",
                    blockchain: profileData.data.network || "",
                };
                setProfile(loadedProfile);
                setSavedProfile(loadedProfile);
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        };
        fetchProfile();
    }, []);

    // /users/profile carries neither the lightning address shown below nor the
    // email the password recovery link reads, so this screen pulls /users/home
    // into context itself. Nothing else on this route does it any more: that
    // used to fall out of the Burger the global header mounted here.
    useEffect(() => {
        getUser();
    }, []);

    const isDirty =
        profile.username !== savedProfile.username ||
        profile.telegram !== savedProfile.telegram ||
        profile.phone !== savedProfile.phone ||
        profile.npub !== savedProfile.npub;

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

    const handleNpubChange = (value) => {
        setProfile((prev) => ({ ...prev, npub: value }));
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
                npub: profile.npub,
                blockchain: profile.blockchain,
            });

            if (response.status === 200) {
                const updatedProfileData = response.data;
                const nextProfile = {
                    ...profile,
                    username: updatedProfileData.username || "",
                    telegram: updatedProfileData.telegram || "",
                    phone: updatedProfileData.phone || "",
                    npub:
                        updatedProfileData.npub !== undefined
                            ? updatedProfileData.npub || ""
                            : profile.npub,
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
                    {user.lightningAddress ? (
                        <YStack gap={"$2"}>
                            <Paragraph color={"$neutral13"} fontSize={"$3"}>
                                Lightning address
                            </Paragraph>
                            <Paragraph
                                color={"$pink400"}
                                fontWeight={"$2"}
                                fontSize={"$3"}
                                textAlign="center"
                            >
                                {user.lightningAddress}
                            </Paragraph>
                        </YStack>
                    ) : null}

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

                    <TamaguiInput
                        label={"npub"}
                        value={profile.npub}
                        onChange={handleNpubChange}
                        placeholder={"npub1..."}
                        autoCapitalize={"none"}
                        autoCorrect={false}
                        spellCheck={false}
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
