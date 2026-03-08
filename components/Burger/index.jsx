import Profile from "../../public/icons/profile_black.svg";
import Verified from "../../public/icons/verified_black.svg";
import emailIcon from "../../public/icons/email_black_24dp.svg";
import Support from "../../public/icons/support_black.svg";
import Movements from "../../public/icons/movements_black.svg";
import Withdrawal from "../../public/icons/withdrawal_black.svg";
import Close from "../../public/icons/close_black.svg";
import Help from "../../public/icons/help_black.svg";
import Lightbulb from "../../public/icons/lightbulb_black.svg";

import { useEffect, useState } from "react";
import Invitations from "../../public/icons/invitations_black.svg";
import Logout from "../logout/logout";
import Referral from "../Referral/referral";
import { sendVerificationEmail, getSettings } from "../../api/api";

import {
    MenuButton,
    Toggle,
    Bars,
    CloseModal,
    BurgerButton,
    customStyles,
    WindowModal,
    AccountMenu,
    XIcon,
    CustomIcon,
    CustomLink,
    BurgerContainer,
} from "./styled";
import { useRouter } from "next/navigation";
import ErrorModal from "../ErrorModal";
import { useUserContext } from "../../context/userContext";

function Burger({ newDesign = false, close = null, externalIsOpen = null }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isReferralOpen, setIsReferralOpen] = useState(false);
    const [isEmailSendOpen, setIsEmailSendOpen] = useState(false);
    const [feedbackUrl, setFeedbackUrl] = useState("");
    const [externalKycUrl, setExternalKycUrl] = useState("");
    const router = useRouter();
    const { user, getUser } = useUserContext();

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

    const bars = [
        {
            id: "bar1",
        },
        {
            id: "bar2",
        },
        {
            id: "bar3",
        },
    ];

    useEffect(() => {
        getUser();
    }, []);

    useEffect(() => {
        async function fetchSettings() {
            const settings = await getSettings();
            setExternalKycUrl(settings.external_kyc_url);
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

    return (
        <BurgerContainer>
            {newDesign ? (
                <></>
            ) : (
                <BurgerButton onClick={() => setIsOpen(true)}>
                    <Toggle>
                        {bars.map((i) => (
                            <Bars key={i.id} id={i.id} />
                        ))}
                    </Toggle>
                </BurgerButton>
            )}

            <WindowModal
                isOpen={isModalOpen()}
                onRequestClose={handleCloseModal}
                style={customStyles}
            >
                <CloseModal onClick={handleCloseModal}>
                    <XIcon width={20} height={20} src={Close} alt={"Close"} />
                </CloseModal>
                <AccountMenu>
                    {user.editProfile ? (
                        <MenuButton>
                            <CustomIcon
                                width={20}
                                height={20}
                                src={Profile}
                                alt="profile"
                            />
                            <CustomLink
                                href={"/profile"}
                                onClick={handleCloseModal}
                            >
                                Profile
                            </CustomLink>
                        </MenuButton>
                    ) : (
                        ""
                    )}
                    <MenuButton
                        onClick={() => {
                            if (user.kycStatus == "Incomplete") {
                                handleCloseModal();
                                router.push(
                                    externalKycUrl +
                                        "?username=" +
                                        encodeURIComponent(user.username)
                                );
                            }
                        }}
                    >
                        <CustomIcon
                            width={20}
                            height={20}
                            src={Verified}
                            alt="Verified"
                        />
                        KYC Verification - {user.kycStatus}
                    </MenuButton>
                    <MenuButton
                        onClick={() => {
                            handleCloseModal();
                            setIsReferralOpen(true);
                        }}
                    >
                        <CustomIcon
                            width={20}
                            height={20}
                            src={Invitations}
                            alt="Referral"
                        />
                        Invitations
                    </MenuButton>
                    <MenuButton>
                        <CustomIcon
                            width={20}
                            height={20}
                            src={Movements}
                            alt="Movements"
                        />
                        <CustomLink
                            href={"/movements"}
                            onClick={handleCloseModal}
                        >
                            Movements
                        </CustomLink>
                    </MenuButton>
                    <MenuButton>
                        <CustomIcon
                            width={20}
                            height={20}
                            src={Withdrawal}
                            alt="withdrawal"
                        />
                        <CustomLink
                            href={"/withdrawal"}
                            onClick={handleCloseModal}
                        >
                            Withdrawal
                        </CustomLink>
                    </MenuButton>
                    <MenuButton>
                        <CustomIcon
                            width={20}
                            height={20}
                            src={Lightbulb}
                            alt="lightbulb"
                        />
                        <CustomLink
                            href={feedbackUrl}
                            onClick={handleCloseModal}
                        >
                            Feedback
                        </CustomLink>
                    </MenuButton>
                    <MenuButton>
                        <CustomIcon
                            width={20}
                            height={20}
                            src={Support}
                            alt="Support"
                        />
                        <CustomLink
                            href={"https://wa.me/5491124060850"}
                            onClick={handleCloseModal}
                        >
                            Support
                        </CustomLink>
                    </MenuButton>
                    {!user.verified && (
                        <MenuButton onClick={handleEmailVerification}>
                            <CustomIcon
                                width={20}
                                height={20}
                                src={emailIcon}
                                alt="Email"
                            />
                            Send email verification
                        </MenuButton>
                    )}
                    <MenuButton>
                        <CustomIcon
                            width={20}
                            height={20}
                            src={Help}
                            alt="Help"
                        />
                        <CustomLink
                            href={"https://wapupay.com/help/"}
                            onClick={handleCloseModal}
                            target="_blank"
                        >
                            Help F.A.Q
                        </CustomLink>
                    </MenuButton>
                    <Logout />
                </AccountMenu>
            </WindowModal>
            <ErrorModal
                message={
                    "We've just sent you an email, please check your inbox."
                }
                state={isEmailSendOpen}
                errorModalOnRequestClose={() => setIsEmailSendOpen(false)}
            />
            <Referral isOpen={isReferralOpen} setIsOpen={setIsReferralOpen} />
        </BurgerContainer>
    );
}

export default Burger;
