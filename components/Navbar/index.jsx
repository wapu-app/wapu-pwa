import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CustomIcon } from "../Burger/styled";
import { CustomLink } from "../Burger/styled";
import {
    NavbarButton,
    NavbarContainer,
    NavbarLogo,
    NavbarButtonContainer,
} from "./styled";
import { useUserContext } from "../../context/userContext";
import { sendVerificationEmail, getSettings } from "../../api/api";
import ErrorModal from "../ErrorModal";
import Referral from "../Referral/referral";
import Verified from "../../public/icons/verified_white.svg";
import Invitations from "../../public/icons/invitations_white.svg";
import Support from "../../public/icons/support_white.svg";
import Movements from "../../public/icons/movements_white.svg";
import Withdrawal from "../../public/icons/withdrawal_white.svg";
import Lightbulb from "../../public/icons/lightbulb_white.svg";
import Profile from "../../public/icons/profile_white.svg";
import Help from "../../public/icons/help_white.svg";
import Logout from "../../public/icons/logout_white.svg";
import WapuIcon from "../../public/wapu_192x192.png";
import HomeIcon from "../../public/icons/home_white.svg";
import emailIcon from "../../public/icons/email_white.svg";
import Link from "next/link";
import userLogout from "../../utils/userLogout";

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isReferralOpen, setIsReferralOpen] = useState(false);
    const [isEmailSendOpen, setIsEmailSendOpen] = useState(false);
    const [feedbackUrl, setFeedbackUrl] = useState("");
    const [externalKycUrl, setExternalKycUrl] = useState("");
    const router = useRouter();
    const pathname = usePathname();
    const { user, getUser } = useUserContext();

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

    const isActiveLink = (path) => {
        return pathname === path;
    };
    const activeStyles = (path) => {
        const isActive = isActiveLink(path);
        return isActive
            ? {
                  background: "linear-gradient(90deg, #e0e0e0, #f0f0f0)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: "bold",
                  textShadow: "0 0 20px rgba(255, 255, 255, 0.8",
              }
            : {};
    };

    const handleHome = () => {
        router.push("/oldHome");
    };

    const handleLogout = () => {
        userLogout();
    };

    const handleEmailVerification = async () => {
        try {
            await sendVerificationEmail(user.email);
            setIsEmailSendOpen(true);
        } catch (error) {
            console.error("Error sending verification email:", error);
        }
    };

    return (
        <NavbarContainer>
            <NavbarLogo>
                <Link href="/oldHome">
                    <CustomIcon
                        width={140}
                        height={140}
                        src={WapuIcon}
                        alt="WapuIcon"
                    />
                </Link>
            </NavbarLogo>
            <NavbarButtonContainer>
                <NavbarButton onClick={handleHome}>
                    <CustomIcon
                        width={20}
                        height={20}
                        src={HomeIcon}
                        alt="Home"
                    />
                    <CustomLink
                        href={"/oldHome"}
                        onClick={() => setIsOpen(false)}
                        style={activeStyles("/oldHome")}
                    >
                        Home
                    </CustomLink>
                </NavbarButton>
                {user.editProfile ? (
                    <NavbarButton>
                        <CustomIcon
                            width={20}
                            height={20}
                            src={Profile}
                            alt="Profile"
                        />
                        <CustomLink
                            href={"/profile"}
                            onClick={() => setIsOpen(false)}
                            style={activeStyles("/profile")}
                        >
                            Profile
                        </CustomLink>
                    </NavbarButton>
                ) : (
                    ""
                )}
                <NavbarButton
                    onClick={() => {
                        if (user.kycStatus == "Incomplete") {
                            setIsOpen(false);
                            router.push(externalKycUrl + "?username=" + encodeURIComponent(user.username));
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
                </NavbarButton>

                <NavbarButton
                    onClick={() => {
                        setIsOpen(false);
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
                </NavbarButton>

                <NavbarButton>
                    <CustomIcon
                        style={{ color: "white" }}
                        width={20}
                        height={20}
                        src={Movements}
                        alt="Movements"
                    />
                    <CustomLink
                        href={"/movements"}
                        onClick={() => setIsOpen(false)}
                        style={activeStyles("/movements")}
                    >
                        Movements
                    </CustomLink>
                </NavbarButton>

                <NavbarButton>
                    <CustomIcon
                        width={20}
                        height={20}
                        src={Withdrawal}
                        alt="withdrawal"
                    />
                    <CustomLink
                        href={"/withdrawal"}
                        onClick={() => setIsOpen(false)}
                        style={activeStyles("/withdrawal")}
                    >
                        Withdrawal
                    </CustomLink>
                </NavbarButton>
                <NavbarButton>
                    <CustomIcon
                        width={20}
                        height={20}
                        src={Lightbulb}
                        alt="withdrawal"
                    />
                    <CustomLink
                        href={feedbackUrl}
                        onClick={() => setIsOpen(false)}
                        style={activeStyles("/feedback")}
                    >
                        Feedback
                    </CustomLink>
                </NavbarButton>

                <NavbarButton>
                    <CustomIcon
                        width={20}
                        height={20}
                        src={Support}
                        alt="Support"
                    />
                    <CustomLink
                        href={"https://wa.me/5491124060850"}
                        onClick={() => setIsOpen(false)}
                    >
                        Support
                    </CustomLink>
                </NavbarButton>
                {!user.verified && (
                    <NavbarButton onClick={handleEmailVerification}>
                        <CustomIcon
                            width={20}
                            height={20}
                            src={emailIcon}
                            alt="Email"
                        />
                        Send email verification
                    </NavbarButton>
                )}
                <NavbarButton>
                    <CustomIcon width={20} height={20} src={Help} alt="Help" />
                    <CustomLink
                        href={"https://wapupay.com/help/"}
                        onClick={() => setIsOpen(false)}
                        target="_blank"
                    >
                        Help F.A.Q.
                    </CustomLink>
                </NavbarButton>
                <NavbarButton onClick={handleLogout}>
                    <CustomIcon
                        width={20}
                        height={20}
                        src={Logout}
                        alt="Logout"
                    />
                    Logout
                </NavbarButton>
            </NavbarButtonContainer>
            <ErrorModal
                message={
                    "We've just sent you an email, please check your inbox."
                }
                state={isEmailSendOpen}
                errorModalOnRequestClose={() => setIsEmailSendOpen(false)}
            />
            <Referral isOpen={isReferralOpen} setIsOpen={setIsReferralOpen} />
        </NavbarContainer>
    );
};
