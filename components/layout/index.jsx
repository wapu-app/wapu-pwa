import { useEffect, useRef, useState } from "react";
import { Header } from "../Header";
import { usePathname, useRouter } from "next/navigation";
import Logo from "../../public/logoWAPU.png";
import Image from "next/image";
import {
    PrincipalContainer,
    CustomMain,
    HiddenNavigation,
    LogoContainer,
} from "./styled";
import Cookies from "js-cookie";
import { useUserContext } from "../../context/userContext";
import CONFIG from "../../config/environment/current";
import { isAuthExpired, getAccessToken } from "../../utils/auth";
import HelpModal from "../HelpModal";
import { isAnAuthablePage } from "../../utils/validations";
import NewNavigation from "../NewFooterNavigation/NewFooterNavigation";

export const Layout = ({ children }) => {
    const CHECK_AUTH_TOKEN_INTERVAL = 5000;
    const [navHidden, setNavHidden] = useState(false);
    const [logoHidden, setLogoHidden] = useState(false);
    const pathname = usePathname();
    const [authToken, setAuthToken] = useState(Cookies.get("isLoggedIn"));
    const {
        setHelpModalState,
        helpModalState,
        user,
        getUser,
    } = useUserContext();
    const router = useRouter();

    // The auth-check interval is created once (below) and must read the live
    // pathname, so mirror it into a ref instead of recreating the interval on
    // every navigation.
    const pathnameRef = useRef(pathname);
    pathnameRef.current = pathname;
    const checkAuthIntervalRef = useRef(null);

    const showNav = [
        "/home",
        "/qrPayment",
        "/pix",
        "/profile",
        "/innerTransfer",
    ];

    const showLogo = [
        "/",
        "/recoverPassword",
        "/resetPassword",
        "/verifyEmail",
        "/processing",
        "/version",
    ];

    useEffect(() => {
        if (Cookies.get("isLoggedIn") === "true" || !isAnAuthablePage(pathname)) {
            return;
        }
        router.push("/newSignUp");
    }, [authToken, pathname]);

    useEffect(() => {
        setNavHidden(!showNav.includes(pathname));
        setLogoHidden(!showLogo.includes(pathname));
    }, [pathname]);

    useEffect(() => {
        const checkAuth = async () => {
            // Anonymous visitors have no session to refresh; skip so we don't
            // poll /users/refresh every few seconds for logged-out users.
            if (Cookies.get("isLoggedIn") !== "true") {
                return;
            }
            if (isAnAuthablePage(pathnameRef.current) && isAuthExpired()) {
                const token = await getAccessToken();
                if (!token) {
                    // Refresh failed mid-session: a returning user has an
                    // account, so send them to login rather than sign-up.
                    router.replace("/login");
                    return;
                }
                setAuthToken(Cookies.get("isLoggedIn"));
            }
        };
        checkAuthIntervalRef.current = setInterval(
            checkAuth,
            CHECK_AUTH_TOKEN_INTERVAL
        );
        return () => {
            clearInterval(checkAuthIntervalRef.current);
        };
        // Created once on mount; reads the live pathname via pathnameRef.
    }, []);

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
                    <NewNavigation />
                )}
            </CustomMain>
        </PrincipalContainer>
    );
};
