"use client";
import { useContext, createContext, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAnAuthablePage } from "../utils/validations";
import { fetchUserData, getSettings } from "../api/api";
import CONFIG from "../config/environment/current";
const UserContext = createContext();

export const UserContextProvider = ({ children }) => {
    const [user, setUser] = useState({
        usdtBalance: "",
        combinedBalance: "",
        combinedBalanceCurrency: "",
        email: "",
        account: "",
        verified: "",
    });
    const [helpModalState, setHelpModalState] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [transactionChoiceIsOpen, setTransactionChoiceIsOpen] =
        useState(false);
    const [notShow, setNotShow] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const getDesignVersion = async () => {
        const settings = await getSettings();
        return settings;
    };

    // Route an unauthenticated visitor to the right sign-up screen. A failing
    // /settings fetch (backend down, network, CORS) must never block the
    // redirect: default to /signup (which itself redirects to /newSignUp) so the
    // app degrades gracefully instead of hanging on a blank page.
    const redirectToSignup = async () => {
        let destination = "/signup";
        try {
            const settings = await getDesignVersion();
            if (settings?.webapp_design === "tamagui-1.0") {
                destination = "/newSignUp";
            }
        } catch (error) {
            // keep the /signup default
        }
        router.push(destination);
    };
    const userFetchPromise = useRef(null);

    const getUser = () => {
        if (!isAnAuthablePage(pathname)) {
            return Promise.resolve();
        }
        // Coalesce concurrent getUser() calls (multiple mount effects fire it in
        // the same render burst) into a single /users/home fetch.
        if (userFetchPromise.current) {
            return userFetchPromise.current;
        }
        const promise = (async () => {
            try {
                const userData = await fetchUserData();
                if (userData.status === 401 || userData.status === 422) {
                    await redirectToSignup();
                    return;
                }

                let usdtArsBuy = null;
                let usdtBrlSell = null;
                let btcUsdBuy = null;
                if (userData.data.rates) {
                    userData.data.rates.forEach((rate) => {
                        if (rate.pair === "USDT/ARS") {
                            usdtArsBuy = rate.buy.toFixed(2);
                        }
                        if (rate.pair === "USDT/BRL") {
                            usdtBrlSell = rate.sell.toFixed(2);
                        }
                        if (rate.pair === "BTC/USD") {
                            btcUsdBuy = rate.buy.toFixed(3);
                        }
                    });
                }

                setUser({
                    username: userData.data.username,
                    usdtBalance: userData.data.usdt_balance || null,
                    combinedBalance: userData.data.combined_balance,
                    combinedBalanceCurrency:
                        userData.data.combined_balance_currency,
                    email: userData.data.email,
                    verified: userData.data.email_verified,
                    pixKey: userData.data.settings?.pix_key || null,
                    pixDepositFee: userData.data.settings?.pix_deposit_fee,
                    minPixDepositBrl:
                        userData.data.settings?.min_pix_deposit_brl || null,
                    minimumWithdrawalAmountUsdt:
                        userData.data.settings?.minimum_withdrawal_amount_usdt /
                            100 || null,
                    minDepositUsdt:
                        userData.data.settings?.min_deposit_usdt || null,
                    qrPaymentFee: userData.data.settings?.qr_payment_fee,
                    fiatTransferFee: userData.data.settings?.fiat_transfer_fee,
                    fastFiatTransferFee:
                        userData.data.settings?.fast_fiat_transfer_fee,
                    blockchains: userData.data.settings?.blockchains || null,
                    referralRewardFeePercentage: userData.data.settings
                        ? userData.data.settings.referral_reward_fee_percentage
                        : null,
                    discountReferralsPercentage: userData.data.settings
                        ? userData.data.settings.discount_referrals_percentage
                        : null,
                    referralRewardsDays: userData.data.settings
                        ? userData.data.settings.referral_rewards_days
                        : null,
                    discountReferralsDays: userData.data.settings
                        ? userData.data.settings.discount_referrals_days
                        : null,
                    rateUsdtArsBuy: usdtArsBuy,
                    rateUsdtBrlSell: usdtBrlSell,
                    rateBtcUsdBuy: btcUsdBuy,
                    rates: userData.data.rates || [],
                    isAdmin: userData.data.is_admin,
                    kycStatus: userData.data.kyc_status,
                    kycTier: userData.data.kyc_tier,
                    qrPending: userData.data.qr_pending,
                    pwaPopUp:
                        userData.data.settings?.features.pwa_pop_up || null,
                    alternativeDeposit:
                        userData.data.settings?.features.alternative_deposit ||
                        null,
                    editProfile:
                        userData.data.settings?.features.edit_profile || null,
                    fastFiatTransfer: userData.data.settings
                        ? userData.data.settings.features.fast_fiat_transfer
                        : null,
                    fiatTransfer: userData.data.settings
                        ? userData.data.settings.features.fiat_transfer
                        : null,
                    sendInnerTransf: userData.data.settings
                        ? userData.data.settings.features.send_inner_transf
                        : null,
                    deposit: userData.data.settings
                        ? userData.data.settings.features.deposit
                        : null,
                    pixDeposit: userData.data.settings
                        ? userData.data.settings.features.pix_deposit
                        : null,
                    qrPayment: userData.data.settings
                        ? userData.data.settings.features.qr_payment
                        : null,
                    showRecentFavContacts: userData.data.settings
                        ? userData.data.settings.features.show_recent_fav_contacts
                        : false,
                    mandatoryAliasValidation: userData.data.settings
                        ? userData.data.settings.features.mandatory_alias_validation
                        : false,
                    userDomain: userData.data.username,
                    betaVersion: userData.data.beta_version,
                });
            } catch (error) {
                console.error("Failed to fetch user data:", error);
                await redirectToSignup();
            } finally {
                userFetchPromise.current = null;
            }
        })();
        userFetchPromise.current = promise;
        return promise;
    };
    return (
        <>
            <UserContext.Provider
                value={{
                    getUser,
                    user,
                    helpModalState,
                    setHelpModalState,
                    isOpen,
                    setIsOpen,
                    transactionChoiceIsOpen,
                    setTransactionChoiceIsOpen,
                    notShow,
                    setNotShow,
                }}
            >
                {children}
            </UserContext.Provider>
        </>
    );
};
export const useUserContext = () => useContext(UserContext);
