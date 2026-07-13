"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@react-hook/media-query";
import { Dialog, ScrollView, Text, YStack } from "tamagui";

import Profile from "../../public/icons/profile_white.svg";
import emailIcon from "../../public/icons/email_white.svg";
import Support from "../../public/icons/support_white.svg";
import Movements from "../../public/icons/movements_white.svg";
import Withdrawal from "../../public/icons/withdrawal_white.svg";
import Help from "../../public/icons/help_white.svg";
import Lightbulb from "../../public/icons/lightbulb_white.svg";
import Invitations from "../../public/icons/invitations_white.svg";
import ApiKeyIcon from "../../public/icons/bolt_white_24dp.svg";
import menuIcon from "../../public/icons/Ic_round/ProfileDefault.svg";

import TamaguiIconButton from "../TamaguiIconButton";
import NewHeaderButton from "../newHeaderButton";
import MenuRow from "./MenuRow";
import Logout from "../logout/logout";
import Referral from "../Referral/referral";
import { sendVerificationEmail, getSettings } from "../../api/api";
import ErrorModal from "../ErrorModal";
import { useUserContext } from "../../context/userContext";

function Burger({ newDesign = false, close = null, externalIsOpen = null }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isReferralOpen, setIsReferralOpen] = useState(false);
    const [isEmailSendOpen, setIsEmailSendOpen] = useState(false);
    const [feedbackUrl, setFeedbackUrl] = useState("");
    const router = useRouter();
    const { user, getUser } = useUserContext();
    // Mirrors the original BurgerContainer media query: the self-toggle
    // trigger only shows on narrow viewports (Navbar covers desktop).
    const isMobile = useMediaQuery("(max-width: 1023px)");

    const handleCloseModal = () => {
        setIsOpen(false);
        if (close) {
            close();
        }
    };

    const isModalOpen = () => {
        if (newDesign) {
            return externalIsOpen;
        }
        return isOpen;
    };

    useEffect(() => {
        getUser();
    }, []);

    useEffect(() => {
        async function fetchSettings() {
            const settings = await getSettings();
            setFeedbackUrl(settings.feedback_url);
        }
        fetchSettings();
    }, []);

    const handleEmailVerification = async () => {
        try {
            await sendVerificationEmail(user.email);
            setIsEmailSendOpen(true);
        } catch (error) {
            console.error("Error sending verification email:", error);
        }
    };

    const handleProfileClick = () => {
        handleCloseModal();
        router.push("/profile");
    };

    const handleInvitationsClick = () => {
        handleCloseModal();
        setIsReferralOpen(true);
    };

    const handleMovementsClick = () => {
        handleCloseModal();
        router.push("/newMovements");
    };

    const handleApiKeyClick = () => {
        handleCloseModal();
        router.push("/apiKey");
    };

    const handleWithdrawalClick = () => {
        handleCloseModal();
        router.push("/newWithdrawal");
    };

    return (
        <>
            {!newDesign && isMobile && (
                <TamaguiIconButton
                    icon={menuIcon}
                    onClick={() => setIsOpen(true)}
                />
            )}

            <Dialog
                modal
                open={isModalOpen()}
                onOpenChange={(open) => {
                    if (!open) {
                        handleCloseModal();
                    }
                }}
            >
                <Dialog.Portal>
                    <Dialog.Overlay
                        key="overlay"
                        animation="slow"
                        opacity={0.9}
                        enterStyle={{ opacity: 0 }}
                        exitStyle={{ opacity: 0 }}
                        style={{
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            zIndex: 10,
                        }}
                    />
                    <Dialog.Content
                        key="content"
                        elevate
                        animation={[
                            "quicker",
                            { opacity: { overshootClamping: true } },
                        ]}
                        enterStyle={{ opacity: 0 }}
                        exitStyle={{ opacity: 0 }}
                        backgroundColor={"$neutral1"}
                        width={"100%"}
                        height={"100%"}
                        maxWidth={"100%"}
                        maxHeight={"100%"}
                        margin={0}
                        borderRadius={0}
                        borderWidth={0}
                        padding={"$3.5"}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            // calc() keeps the token padding as a floor and only
                            // adds extra clearance on notched devices, instead of
                            // env() (0px on non-notched devices) replacing it.
                            paddingTop: "calc(env(safe-area-inset-top) + 16px)",
                            paddingBottom:
                                "calc(env(safe-area-inset-bottom) + 16px)",
                        }}
                    >
                        <YStack flex={1} width={"$width100"} height={"$height100"}>
                            <NewHeaderButton
                                isCloseButton
                                onClick={handleCloseModal}
                            />
                            <Text
                                fontFamily={"$heading"}
                                fontSize={"$4"}
                                color={"$neutral13"}
                                fontWeight={"$2"}
                                marginTop={"$3.5"}
                                marginBottom={"$2.5"}
                            >
                                My Account
                            </Text>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <YStack gap={"$1"} paddingBottom={"$8"}>
                                    {user.editProfile && (
                                        <MenuRow
                                            icon={Profile}
                                            label={"Profile"}
                                            onPress={handleProfileClick}
                                        />
                                    )}
                                    <MenuRow
                                        icon={ApiKeyIcon}
                                        label={"API key"}
                                        onPress={handleApiKeyClick}
                                    />
                                    <MenuRow
                                        icon={Invitations}
                                        label={"Invitations"}
                                        onPress={handleInvitationsClick}
                                    />
                                    <MenuRow
                                        icon={Movements}
                                        label={"Movements"}
                                        onPress={handleMovementsClick}
                                    />
                                    <MenuRow
                                        icon={Withdrawal}
                                        label={"Withdrawal"}
                                        onPress={handleWithdrawalClick}
                                    />
                                    <MenuRow
                                        icon={Lightbulb}
                                        label={"Feedback"}
                                        href={feedbackUrl}
                                        onPress={handleCloseModal}
                                    />
                                    <MenuRow
                                        icon={Support}
                                        label={"Support"}
                                        href={"https://wa.me/5491124060850"}
                                        onPress={handleCloseModal}
                                    />
                                    {!user.verified && (
                                        <MenuRow
                                            icon={emailIcon}
                                            label={"Send email verification"}
                                            onPress={handleEmailVerification}
                                        />
                                    )}
                                    <MenuRow
                                        icon={Help}
                                        label={"Help F.A.Q"}
                                        href={"https://wapupay.com/#ayuda"}
                                        target={"_blank"}
                                        onPress={handleCloseModal}
                                    />
                                    <Logout />
                                </YStack>
                            </ScrollView>
                        </YStack>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog>

            <ErrorModal
                message={
                    "We've just sent you an email, please check your inbox."
                }
                state={isEmailSendOpen}
                errorModalOnRequestClose={() => setIsEmailSendOpen(false)}
            />
            <Referral isOpen={isReferralOpen} setIsOpen={setIsReferralOpen} />
        </>
    );
}

export default Burger;
