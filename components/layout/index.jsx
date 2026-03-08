import { useEffect, useState } from "react";
import { Header } from "../Header";
import { Navigation } from "../Navigation";
import { TransactionChoiceModal } from "../transactionChoice";
import { usePathname, useRouter } from "next/navigation";
import Logo from "../../public/logoWAPU.png";
import Image from "next/image";
import {
    PrincipalContainer,
    CustomMain,
    HiddenNavigation,
    CustomModal,
    ModalContainer,
    customStyles,
    Ptext,
    ButtonContainer,
    LogoContainer,
} from "./styled";
import Cookies from "js-cookie";
import { useUserContext } from "../../context/userContext";
import { Button } from "../Button";
import CONFIG from "../../config/environment/current";
import { isAuthExpired, getAccessToken } from "../../utils/auth";
import HelpModal from "../HelpModal";
import { isAnAuthablePage } from "../../utils/validations";
import NewNavigation from "../NewFooterNavigation/NewFooterNavigation";

import { getSettings, getProfile } from "../../api/api";

export const Layout = ({ children }) => {
    const CHECK_AUTH_TOKEN_INTERVAL = 5000;
    const [navHidden, setNavHidden] = useState(false);
    const [logoHidden, setLogoHidden] = useState(false);
    const [newDesign, setNewDesign] = useState(false);
    const pathname = usePathname();
    const [authToken, setAuthToken] = useState(Cookies.get("isLoggedIn"));
    const {
        isOpen,
        setIsOpen,
        transactionChoiceIsOpen,
        setTransactionChoiceIsOpen,
        setHelpModalState,
        helpModalState,
        user,
        getUser,
        setUser,
    } = useUserContext();
    const router = useRouter();

    const showNav = [
        "/oldHome",
        "/home",
        "/qrPayment",
        "/pix",
        "/deposit",
        "/movements",
        "/profile",
        "/withdrawal",
        "/send",
        "/innerTransfer",
        "/transactionComplete",
        "/transactionDetail",
    ];

    const showLogo = [
        "/",
        "/signup",
        "/recoverPassword",
        "/resetPassword",
        "/verifyEmail",
        "/processing",
        "/version",
        "/deposit",
    ];

    const getDesignVersion = async () => {
        const settings = await getSettings();
        return settings;
    };

    useEffect(() => {
        getDesignVersion().then((settings) => {
            if (Cookies.get("isLoggedIn") !== "true") {
                if (isAnAuthablePage(pathname)) {
                    router.push(
                        settings.webapp_design === "tamagui-1.0"
                            ? "/newSignUp"
                            : "/signup"
                    );
                }
            }
        });
    }, [authToken, pathname]);

    const checkBetaVersion = async () => {
        try {
            const profileData = await getProfile();
            // Only redirect from home to old home if user explicitly has beta_version set to 0
            if (pathname === "/home" && profileData.data.beta_version === 0) {
                router.push("/oldHome");
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    useEffect(() => {
        if (["/oldHome", "/home"].includes(pathname)) {
            checkBetaVersion();
        }
        setNavHidden(!showNav.includes(pathname));
        setLogoHidden(!showLogo.includes(pathname));
        setNewDesign(pathname !== "/oldHome");

        const checkAuth = async () => {
            if (isAnAuthablePage(pathname)) {
                if (isAuthExpired()) {
                    getAccessToken();
                    setAuthToken(Cookies.get("isLoggedIn"));
                }
            }
        };
        const intervalId = setInterval(checkAuth, CHECK_AUTH_TOKEN_INTERVAL);
        return () => {
            clearInterval(intervalId); // Clear the interval when the component is unmounted
        };
    }, [pathname]);

    const toAlternativeDepositChoice = () => {
        setHelpModalState(true);
    };
    const whatsappMessage = `Hi, I need to top up my Wapu account through Wise, Pix or a bank transfer. My user is ${user.username}`;
    const helpModalMessage = {
        title: "Do you need an alternative method for making a deposit?",
        subtitle: "We are here to assist you.",
        content1:
            "We can accept Euros, Dollars, Reais and other currencies through Wise, Pix or bank transfer. Simply get in touch with us.",
        content2: `Please note that in order to make a deposit via bank transfer, you'll need to complete the KYC (Know Your Customer) process first.`,
        content3:
            "Send us a message specifying the currency and the country of origin.",
        href: `https://api.whatsapp.com/send?phone=5491124060850&text=${encodeURIComponent(
            whatsappMessage
        )}`,
        text_button: "Whatsapp",
        target: "_blank",
    };
    return (
        <PrincipalContainer>
            {CONFIG.MODE === "PROD" ? (
                <noscript
                    dangerouslySetInnerHTML={{
                        __html: `
                <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WPXBKFQZ" 
                height="0" width="0" style="display:none;visibility:hidden"></iframe>
              `,
                    }}
                />
            ) : (
                <></>
            )}
            <Header />
            <CustomMain>
                <HelpModal
                    message={helpModalMessage}
                    state={helpModalState}
                    helpModalOnRequestClose={() => {
                        setHelpModalState(false);
                    }}
                />
                <CustomModal
                    isOpen={isOpen}
                    onRequestClose={() => setIsOpen(false)}
                    style={customStyles}
                >
                    <ModalContainer>
                        <Ptext>Select how to deposit</Ptext>
                        <ButtonContainer>
                            {user.pixDeposit ? (
                                <Button text={"Pix"} href={"/pix"} />
                            ) : (
                                <></>
                            )}
                            {user.deposit ? (
                                <Button text={"Blockchain"} href={"/deposit"} />
                            ) : (
                                <></>
                            )}
                            {user.alternativeDeposit ? (
                                <Button
                                    text={"Other alternatives"}
                                    onClick={toAlternativeDepositChoice}
                                />
                            ) : (
                                <></>
                            )}
                        </ButtonContainer>
                    </ModalContainer>
                </CustomModal>
                <TransactionChoiceModal
                    isOpen={transactionChoiceIsOpen}
                    close={() => setTransactionChoiceIsOpen(false)}
                ></TransactionChoiceModal>
                {logoHidden ? (
                    <></>
                ) : (
                    <LogoContainer className="logo">
                        <Image src={Logo} width={150} alt="Wapu logo" />
                    </LogoContainer>
                )}
                {children}
                {navHidden ? (
                    <HiddenNavigation />
                ) : (
                    <>{newDesign ? <NewNavigation /> : <Navigation />} </>
                )}
            </CustomMain>
        </PrincipalContainer>
    );
};
