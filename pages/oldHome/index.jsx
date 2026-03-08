import { useEffect, useState } from "react";
import {
    Container,
    CustomText,
    TextWrapper,
    RateIcon,
    RateWrapper,
    RateText,
    RateTitleWrap,
    RateValues,
    CustomTextContainer,
    CustomSelectContainer,
    CustomBalance,
    CustomBalanceHidden,
    CustomHide,
    ContainerX,
} from "./styled";
import { useUserContext } from "../../context/userContext";
import UsdtArs from "../../public/iconars.png";
import Invitations from "../../public/icons/invitations_white.svg";
import { CustomSelect } from "../../components/Select";
import AddToHomeScreen from "../../components/AddToHomeScreen/AddToHomeScreen";
import { useRouter } from "next/router";
import ModalWithButton from "../../components/ModalWithButton";
import TamaguiLink from "../../components/TamaguiLink";
import Referral from "../../components/Referral/referral";
import { getSettings } from "../../api/api";

export const Principal = () => {
    const { user, getUser } = useUserContext();
    const [isReferralOpen, setIsReferralOpen] = useState(false);
    const [currency, setCurrency] = useState("");
    const [currencies, setCurrencies] = useState();
    const [balanceHidden, setBalanceHidden] = useState(false);
    const [onboardingModalState, setOnboardingModalState] = useState(false);
    const [externalKycUrl, setExternalKycUrl] = useState("");
    const router = useRouter();

    const onboarding = () => {
        const { new_user } = router.query;
        if (new_user) {
            setOnboardingModalState(true);
        }
    };
    const hideBalance = () => {
        setBalanceHidden((prevState) => !prevState);
    };
    const currencyOptions = [
        { id: 1, name: "USD" },
        { id: 2, name: "BRL" },
        { id: 3, name: "ARS" },
    ];
    const handleCurrencyChange = (e) => {
        setCurrency(e.target.value);
        whichBalance(e.target.value);
    };
    const BalanceBRL = user.usdtBalance * user.rateUsdtBrlSell;

    const whichBalance = (selectedCurrency) => {
        if (selectedCurrency === "3") {
            setCurrencies(user.combinedBalance);
        } else if (selectedCurrency === "2") {
            setCurrencies(BalanceBRL.toFixed(2));
        } else if (selectedCurrency === "1") {
            setCurrencies(user.usdtBalance);
        }
    };

    const setKycUrl = async () => {
        const settings = await getSettings();
        setExternalKycUrl(settings.external_kyc_url);
    };

    useEffect(() => {
        getUser();
        setKycUrl();
    }, []);
    useEffect(() => {
        onboarding();
    }, [router.query]);
    const content = {
        message: `Great to have you here! 🎉`,
        secondMessage: `Ready to start transferring pesos? Just need a quick ID verification (passport works) first! Let's do this! 🚀`,
        primaryButton: "Start KYC",
        primaryButtonOnClick: () => {
            router.push(externalKycUrl);
        },
    };
    return (
        <Container>
            <ModalWithButton /* onboarding modal */
                content={content}
                state={onboardingModalState}
                errorModalOnRequestClose={() => setOnboardingModalState(false)}
            />
            <TextWrapper>
                <CustomText>Hi, {user?.username}!</CustomText>
                <CustomTextContainer>
                    <ContainerX onClick={hideBalance}>
                        {balanceHidden ? (
                            <CustomBalanceHidden>$ ***</CustomBalanceHidden>
                        ) : (
                            <CustomBalance>
                                {currencies === undefined
                                    ? new Intl.NumberFormat("en-US", {
                                          style: "currency",
                                          currency: "USD",
                                      }).format(user.usdtBalance)
                                    : new Intl.NumberFormat("en-US", {
                                          style: "currency",
                                          currency: "USD",
                                      }).format(currencies)}
                            </CustomBalance>
                        )}
                        <CustomHide>
                            {balanceHidden ? (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-5 h-5"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z"
                                        clipRule="evenodd"
                                    />
                                    <path d="m10.748 13.93 2.523 2.523a9.987 9.987 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z" />
                                </svg>
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-5 h-5"
                                >
                                    <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                                    <path
                                        fillRule="evenodd"
                                        d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                        </CustomHide>
                    </ContainerX>
                    <CustomSelectContainer>
                        <CustomSelect
                            label={"USD"}
                            name="currency"
                            value={currency}
                            onChange={handleCurrencyChange}
                            options={currencyOptions}
                            style={{
                                border: "1px solid #0b0b0b",
                                borderRadius: "4px",

                                width: "100%",
                                boxSizing: "border-box",
                                marginBottom: 0,
                                fontSize: "12px",
                                color: "#fafafa",
                                background: "#0b0b0b",
                            }}
                        />
                    </CustomSelectContainer>
                </CustomTextContainer>
            </TextWrapper>

            <RateWrapper
                onClick={() => {
                    setIsReferralOpen(true);
                }}
            >
                <RateText>
                    <RateIcon
                        width={65}
                        height={35}
                        src={Invitations}
                        alt="iconusdt/ars"
                    />
                </RateText>
                <RateValues>
                    <RateText>Invite Friends and Earn rewards!</RateText>
                    <TamaguiLink
                        text={"Learn More ..."}
                        target="_blank"
                        style={{ padding: "4px" }}
                    />
                </RateValues>
            </RateWrapper>

            <RateTitleWrap>
                <RateText>Exchange Rates</RateText>
            </RateTitleWrap>
            <RateWrapper>
                <RateText>
                    <RateIcon
                        width={65}
                        height={35}
                        src={UsdtArs}
                        alt="iconusdt/ars"
                    />
                </RateText>
                <RateValues>
                    <RateText>$1.00 USDT</RateText>
                    <RateText>${user?.rateUsdtArsBuy} ARS</RateText>
                </RateValues>
            </RateWrapper>
            {user.pwaPopUp ? <AddToHomeScreen /> : ""}
            <Referral isOpen={isReferralOpen} setIsOpen={setIsReferralOpen} />
        </Container>
    );
};

export default Principal;
