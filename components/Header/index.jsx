"use client";
import { CustomHeader, CustomHelpButton, Container } from "./styled";
import Burger from "../Burger/index";
import { usePathname } from "next/navigation";
import HelpButton from "../HelpButton";
import Icon from "@mdi/react";
import { mdiHelp } from "@mdi/js";
import { useUserContext } from "../../context/userContext";
import MediaIcons from "../MediaIcons";

// Routes that bring their own header (a NewHeaderButton with a back arrow, or
// none at all), so the global one must stay out of the way.
const HIDDEN_PATHS = [
    "/signup",
    "/recoverPassword",
    "/resetPassword",
    "/verifyEmail",
    "/processing",
    "/",
    "/login",
    "/newSignUp",
    "/home",
    "/newSend",
    "/newFastSend",
    "/newTransactionComplete",
    "/version",
    "/newTransactionPending",
    "/newTransactionDetail",
    "/newMovements",
    "/newDepositChoice",
    "/newAlternativeDeposit",
    "/newWithdrawal",
    "/newBlockchainDeposit",
    "/bitcoinDeposit",
    "/profile",
    "/apiKey",
];

const HELP_BUTTON_PATHS = ["/qrPayment"];

export const Header = () => {
    const { setHelpModalState } = useUserContext();
    const pathname = usePathname();

    // Derived, not state: with useState(false) + useEffect the first client
    // render always mounted <Burger />, which then unmounted on the next
    // commit — a header flash plus the mount effects Burger carries (getUser,
    // getSettings, the referral dialog) firing on every hidden route.
    const headerHidden = HIDDEN_PATHS.includes(pathname);
    const helpButtonShow = HELP_BUTTON_PATHS.includes(pathname);

    return (
        <Container>
            {helpButtonShow ? (
                <CustomHelpButton>
                    <HelpButton
                        onClick={() => {
                            setHelpModalState(true);
                        }}
                        text={<Icon path={mdiHelp} size={0.8} />}
                    />
                </CustomHelpButton>
            ) : (
                <div></div>
            )}
            {headerHidden ? (
                <></>
            ) : (
                <CustomHeader>
                    <Burger />
                    <MediaIcons />
                </CustomHeader>
            )}
        </Container>
    );
};
