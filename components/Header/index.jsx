"use client";
import { CustomHeader, Container } from "./styled";
import Burger from "../Burger/index";
import { usePathname } from "next/navigation";
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
    "/swaps",
    "/profile",
    "/apiKey",
];

export const Header = () => {
    const pathname = usePathname();

    // Derived, not state: with useState(false) + useEffect the first client
    // render always mounted <Burger />, which then unmounted on the next
    // commit — a header flash plus the mount effects Burger carries (getUser,
    // getSettings) firing on every hidden route.
    const headerHidden = HIDDEN_PATHS.includes(pathname);

    return (
        <Container>
            <div></div>
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
