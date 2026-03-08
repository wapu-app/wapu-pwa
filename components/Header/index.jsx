"use client";
import { useState, useEffect } from "react";
import { CustomHeader, CustomHelpButton, Container } from "./styled";
import Burger from "../Burger/index";
import { usePathname } from "next/navigation";
import HelpButton from "../HelpButton";
import Icon from "@mdi/react";
import { mdiHelp } from "@mdi/js";
import { useUserContext } from "../../context/userContext";
import { Navbar } from "../Navbar";
import MediaIcons from "../MediaIcons";

export const Header = () => {
    const { setHelpModalState } = useUserContext();
    const [headerHidden, setHeaderHidden] = useState(false);
    const [helpButtonShow, setHelpButtonShow] = useState(false);
    const pathname = usePathname();

    const hiddenPath = [
        "/signup",
        "/recoverPassword",
        "/resetPassword",
        "/verifyEmail",
        "/processing",
        "/deposit",
        "/",
        "/login",
        "/newSignUp",
        "/home",
        "/newSend",
        "/newFastSend",
        "/newVerifyEmail",
        "/newTransactionComplete",
        "/version",
        "/newTransactionPending",
        "/newTransactionDetail",
        "/newMovements",
        "/newDepositChoice",
        "/newAlternativeDeposit",
        "/newWithdrawal",
        "/newBlockchainDeposit",
        "/bitcoinDeposit"
    ];
    const helpButtonPath = ["/send", "/qrPayment"];
    useEffect(() => {
        if (hiddenPath.includes(pathname)) {
            setHeaderHidden(true);
        } else {
            setHeaderHidden(false);
        }
    }, [pathname]);
    useEffect(() => {
        if (helpButtonPath.includes(pathname)) {
            setHelpButtonShow(true);
        } else {
            setHelpButtonShow(false);
        }
    }, [pathname]);

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
                    <Navbar />
                    <Burger />
                    <MediaIcons />
                </CustomHeader>
            )}
        </Container>
    );
};
