import { useState, useEffect } from "react";
import { YStack, XStack, Paragraph } from "tamagui";
import TamaguiIconButton from "../../components/TamaguiIconButton";
import TamaguiButton from "../../components/TamaguiButton";
import TamaguiSendModal from "../../components/TamaguiSendModal";
import depositIcon from "../../public/icons/Ic_Transaction_Black/Deposit.svg";
import SendIcon from "../../public/icons/Ic_Transaction_Black/Send.svg";
import QRIcon from "../../public/icons/Ic_Transaction_Black/QRPay.svg";
import EarnReferral from "../../public/icons/Ic_Transaction_Black/EarnReferral.svg";
import TamaguiProgressBar from "../../components/TamaguiProgressBar";
import { useUserContext } from "../../context/userContext";
import Referral from "../../components/Referral/referral";
import { useRouter } from "next/router";
import { getSettings } from "../../api/api";
import NewInfoCard from "../../components/NewInfoCard/NewInfoCard";
import ExchangeRateCard from "../../components/ExchangeRateCard/ExchangeRateCard";

export default function index() {
    const router = useRouter();

    const { getUser, user } = useUserContext();

    const [isReferralOpen, setIsReferralOpen] = useState(false);
    const [externalKycUrl, setExternalKycUrl] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleQRPay = () => {
        router.push("/qrPayment");
    };

    const handleEarn = () => {
        setIsReferralOpen(true);
    };

    const handleKYC = () => {
        router.push(
            externalKycUrl + "?username=" + encodeURIComponent(user.username)
        );
    };

    const handleDeposit = () => {
        router.push("/newDepositChoice");
    };

    useEffect(() => {
        async function fetchSettings() {
            const settings = await getSettings();
            setExternalKycUrl(settings.external_kyc_url);
        }
        fetchSettings();
    }, []);

    return (
        <YStack
            width="$width100"
            height={"$height100"}
            display="flex"
            flexDirection="column"
            justifyContent="flex-start"
            gap={"$3.5"}
            marginTop="0"
            alignItems="center"
        >
            <NewInfoCard />
            <TamaguiSendModal isOpen={isModalOpen} onClose={closeModal} />
            <Referral isOpen={isReferralOpen} setIsOpen={setIsReferralOpen} />

            <XStack
                width="$width90"
                display="flex"
                flexWrap="wrap"
                justifyContent="space-between"
                paddingLeft={"$3.5"}
                paddingRight={"$3.5"}
                paddingTop={"$3"}
                paddingBottom={"$3"}
                borderRadius={"$4.5"}
                backgroundColor={"$neutral3"}
            >
                <TamaguiIconButton
                    icon={depositIcon}
                    backgroundColor={"$pink500"}
                    size={"48px"}
                    label={"Deposit"}
                    fontSizeLabel={"$5"}
                    colorLabel={"$neutral12"}
                    gap={"$2.5"}
                    onClick={handleDeposit}
                />
                {user.qrPayment && (
                    <TamaguiIconButton
                        icon={QRIcon}
                        backgroundColor={"$pink500"}
                        size={"48px"}
                        label={"QR Pay"}
                        fontSizeLabel={"$5"}
                        colorLabel={"$neutral12"}
                        gap={"$2.5"}
                        onClick={handleQRPay}
                    />
                )}
                <TamaguiIconButton
                    icon={SendIcon}
                    backgroundColor={"$pink500"}
                    size={"48px"}
                    label={"Send"}
                    fontSizeLabel={"$5"}
                    colorLabel={"$neutral12"}
                    gap={"$2.5"}
                    onClick={openModal}
                />
                <TamaguiIconButton
                    icon={EarnReferral}
                    backgroundColor={"$pink500"}
                    size={"48px"}
                    label={"Earn"}
                    fontSizeLabel={"$5"}
                    colorLabel={"$neutral12"}
                    gap={"$2.5"}
                    onClick={handleEarn}
                />
            </XStack>

            {user.kycStatus == "X" ? ( //"Incomplete" ? ( // This has been disabled
                <YStack
                    width="$width90"
                    display="flex"
                    justifyContent="space-between"
                    gap="$5"
                    paddingLeft={"$3.5"}
                    paddingRight={"$3.5"}
                    paddingTop={"$5"}
                    paddingBottom={"$5"}
                    borderRadius={"$4.5"}
                    backgroundColor={"$neutral4"}
                >
                    <YStack display="flex" flexDirection="column" gap="$3.5">
                        <TamaguiProgressBar
                            backgroundColor={"#E589B7"}
                            progress={
                                user.kycTier === 0
                                    ? 20
                                    : user.kycTier === 1
                                    ? 50
                                    : user.kycTier === 2
                                    ? 75
                                    : 0
                            }
                        />
                        <Paragraph
                            color={"$neutral12"}
                            fontSize={"$4"}
                            fontWeight={"$1"}
                        >
                            Complete the verification steps to fully access to
                            WapuPay
                        </Paragraph>
                    </YStack>
                    <TamaguiButton
                        middle
                        text={"Verify Identification"}
                        onClick={handleKYC}
                    />
                </YStack>
            ) : (
                ""
            )}

            <ExchangeRateCard />
        </YStack>
    );
}
