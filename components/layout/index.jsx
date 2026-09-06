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
    SessionRecovery,
} from "./styled";
import Cookies from "js-cookie";
import { useUserContext } from "../../context/userContext";
import CONFIG from "../../config/environment/current";
import { isAuthExpired, refreshAccessToken } from "../../utils/auth";
import HelpModal from "../HelpModal";
import { isAnAuthablePage } from "../../utils/validations";
import NewNavigation from "../NewFooterNavigation/NewFooterNavigation";
import Spinner from "../CustomSpinner";

export const Layout = ({ children }) => {
    const REFRESH_TOKEN_INTERVAL = 60 * 60 * 1000;
    const [navHidden, setNavHidden] = useState(false);
    const [logoHidden, setLogoHidden] = useState(false);
    const pathname = usePathname();
    const [restoredPathname, setRestoredPathname] = useState(null);
    const {
        setHelpModalState,
        helpModalState,
        user,
        getUser,
    } = useUserContext();
    const router = useRouter();

    const pathnameRef = useRef(pathname);
    pathnameRef.current = pathname;
    const refreshIntervalRef = useRef(null);
    const sessionNeedsRestore =
        isAnAuthablePage(pathname) &&
        (Cookies.get("isLoggedIn") !== "true" || isAuthExpired());
    const canRenderProtectedContent =
        !sessionNeedsRestore || restoredPathname === pathname;

    const showNav = [
        "/home",
        "/qrPayment",
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
        let cancelled = false;

        const restoreSession = async () => {
            if (!isAnAuthablePage(pathname)) {
                return;
            }
            if (!sessionNeedsRestore) {
                return;
            }

            const token = await refreshAccessToken();
            if (cancelled) {
                return;
            }
            if (!token) {
                router.replace("/login");
                return;
            }
            setRestoredPathname(pathname);
        };

        restoreSession();
        return () => {
            cancelled = true;
        };
    }, [pathname]);

    useEffect(() => {
        setNavHidden(!showNav.includes(pathname));
        setLogoHidden(!showLogo.includes(pathname));
    }, [pathname]);

    useEffect(() => {
        const refreshSession = async () => {
            if (Cookies.get("isLoggedIn") !== "true") {
                return;
            }
            if (!isAnAuthablePage(pathnameRef.current)) {
                return;
            }

            const token = await refreshAccessToken();
            if (!isAnAuthablePage(pathnameRef.current)) {
                return;
            }
            if (!token) {
                router.replace("/login");
                return;
            }
        };
        refreshIntervalRef.current = setInterval(
            refreshSession,
            REFRESH_TOKEN_INTERVAL
        );
        return () => {
            clearInterval(refreshIntervalRef.current);
        };
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
            {canRenderProtectedContent ? (
                <>
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
                </>
            ) : (
                <SessionRecovery role="status" aria-live="polite">
                    <Spinner />
                    <span>Restoring your session…</span>
                </SessionRecovery>
            )}
        </PrincipalContainer>
    );
};
