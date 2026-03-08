"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import wapuLogo from "../../public/wapuLogo.svg";
import profile from "../../public/icons/Ic_round/ProfileDefault.svg";
import eye from "../../public/eye.svg";
import eyeOff from "../../public/eye-closed.svg";
import { YStack, XStack, Paragraph, useMedia } from "tamagui";
import TamaguiIconButton from "../TamaguiIconButton";
import { CurrencySelect } from "../CurrencySelect";
import styles from "./NewInfoCard.module.css";
import { useUserContext } from "../../context/userContext";
import Burger from "../Burger/index";
export default function NewInfoCard() {
    const { user, getUser } = useUserContext();
    const items = [
        { name: "ARS", id: "ARS" },
        { name: "USD", id: "USD" },
        { name: "BRL", id: "BRL" },
    ];
    const [balanceHidden, setBalanceHidden] = useState(false);
    const [currency, setCurrency] = useState("USD");
    const [currencyAmount, setCurrencyAmount] = useState();
    const [hamburguerMenuOpen, setHamburguerMenuOpen] = useState(false);

    const media = useMedia();

    const handleCloseHamburguer = () => {
        setHamburguerMenuOpen(false);
    };

    const handleProfileClick = () => {
        setHamburguerMenuOpen(true);
    };

    const hideBalance = () => {
        setBalanceHidden((prevState) => !prevState);
    };
    const handleCurrencyChange = (index) => {
        const selectedCurrency = items[index].name;
        setCurrency(selectedCurrency);
        whichBalance(selectedCurrency);
    };
    const BalanceBRL = user.usdtBalance * user.rateUsdtBrlSell;

    const whichBalance = (selectedCurrency) => {
        if (selectedCurrency === "ARS") {
            setCurrencyAmount(user.combinedBalance);
        } else if (selectedCurrency === "BRL") {
            setCurrencyAmount(BalanceBRL.toFixed(2));
        } else if (selectedCurrency === "USD") {
            setCurrencyAmount(user.usdtBalance);
        }
    };
    useEffect(() => {
        getUser();
    }, []);
    return (
        <YStack
            width={"$width100"}
            display="flex"
            justifyContent="space-between"
            backgroundColor={"green"}
            borderBottomRightRadius={"$4.5"}
            borderBottomLeftRadius={"$4.5"}
            borderBottomWidth={"$1"}
            borderColor={"$pink700"}
            padding={"$4"}
            paddingTop={"$8"}
            margin="0"
            className={styles.animatedBackground}
        >
            <Burger
                newDesign={true}
                externalIsOpen={hamburguerMenuOpen}
                close={handleCloseHamburguer}
            />
            <XStack
                width="$width100"
                display="flex"
                justifyContent="space-between"
                gap={"$2.5"}
            >
                <Image
                    src={wapuLogo}
                    alt="wapu logo"
                    style={{ width: "70px", height: "auto" }}
                />

                <TamaguiIconButton
                    icon={profile}
                    //notification={true}  For add or not the unread status
                    primary
                    color={"#A09FA6"}
                    onClick={handleProfileClick}
                />
            </XStack>
            <YStack width={"60%"} gap={"$1.5"}>
                <XStack
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Paragraph
                        color={"$neutral11"}
                        fontWeight={"$2"}
                        fontSize={"$4"}
                    >
                        Total Balance
                    </Paragraph>
                    {balanceHidden ? (
                        <TamaguiIconButton
                            onClick={hideBalance}
                            icon={eyeOff}
                        />
                    ) : (
                        <TamaguiIconButton onClick={hideBalance} icon={eye} />
                    )}
                </XStack>
                <XStack
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    backgroundColor={"#00000091"}
                    padding={"$2.5"}
                    borderRadius={"$4.5"}
                    flexWrap="wrap"
                    minWidth={"$14"}
                >
                    {balanceHidden ? (
                        <Paragraph
                            color={"$neutral12"}
                            fontWeight={"$2"}
                            fontSize={"$2"}
                        >
                            ***
                        </Paragraph>
                    ) : (
                        <Paragraph
                            color={"$neutral12"}
                            fontWeight={"$2"}
                            fontSize={"$2"}
                            overflow="hidden"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                            marginBottom={media.xs ? "$2" : 0}
                        >
                            {currencyAmount === undefined
                                ? new Intl.NumberFormat("en-US", {
                                      style: "currency",
                                      currency: "USD",
                                  }).format(user.usdtBalance)
                                : new Intl.NumberFormat("en-US", {
                                      style: "currency",
                                      currency: "USD",
                                  }).format(currencyAmount)}
                        </Paragraph>
                    )}

                    <CurrencySelect
                        value={currency}
                        onChange={handleCurrencyChange}
                        items={items}
                    />
                </XStack>
            </YStack>
        </YStack>
    );
}
