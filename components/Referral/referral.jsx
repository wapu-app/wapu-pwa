"use client";
import { useState, useEffect } from "react";
import { Dialog, YStack, XStack, Paragraph } from "tamagui";

import TamaguiInput from "../TamaguiInput";
import TamaguiButton from "../TamaguiButton";
import TamaguiIconButton from "../TamaguiIconButton";
import NewHeaderButton from "../newHeaderButton";

import CopyIcon from "../../public/icons/content_copy_FILL0_wght400_GRAD0_opsz24.svg";

import { getReferralCode } from "../../api/api";
import { useUserContext } from "../../context/userContext";

const COPIED_FEEDBACK_MS = 1500;

export default function Referral({ isOpen, setIsOpen }) {
    const [email, setEmail] = useState("");
    const [referralLink, setReferralLink] = useState("");
    const [copied, setCopied] = useState(false);
    const { user } = useUserContext();

    const handleGetReferralCode = async () => {
        try {
            const { data } = await getReferralCode(email, "");
            setReferralLink(data.referral_link);
        } catch (error) {
            console.error(error.message);
        }
    };

    useEffect(() => {
        handleGetReferralCode();
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    };

    return (
        <Dialog modal open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Portal>
                <Dialog.Overlay
                    key="referral-overlay"
                    animation="quick"
                    backgroundColor={"$neutral1"}
                    opacity={1}
                    enterStyle={{ opacity: 0 }}
                    exitStyle={{ opacity: 0 }}
                />
                <Dialog.Content
                    key="referral-content"
                    animation={[
                        "quicker",
                        { opacity: { overshootClamping: true } },
                    ]}
                    enterStyle={{ y: 20, opacity: 0 }}
                    exitStyle={{ y: 10, opacity: 0 }}
                    backgroundColor={"$neutral1"}
                    borderWidth={0}
                    borderRadius={0}
                    width={"$width100"}
                    height={"$height100"}
                    padding={0}
                >
                    <YStack
                        width={"$width100"}
                        height={"$height100"}
                        alignItems="center"
                        overflow="scroll"
                    >
                        <YStack padding={"$4"} width={"$width100"}>
                            <NewHeaderButton
                                isCloseButton
                                onClick={() => setIsOpen(false)}
                            />
                        </YStack>

                        <YStack
                            width={"$width90"}
                            gap={"$5"}
                            paddingBottom={"$8"}
                        >
                            <Paragraph
                                color={"$neutral13"}
                                fontFamily={"$heading"}
                                fontSize={"$4"}
                                fontWeight={"$2"}
                            >
                                Invite and Earn with Wapu!
                            </Paragraph>

                            <YStack
                                backgroundColor={"$neutral3"}
                                borderRadius={"$7"}
                                padding={"$4"}
                                gap={"$2.5"}
                            >
                                <Paragraph
                                    color={"$neutral13"}
                                    fontWeight={"$2"}
                                    fontSize={"$3"}
                                >
                                    For You
                                </Paragraph>
                                <Paragraph color={"$neutral11"} fontSize={"$4"}>
                                    Get rewarded as soon as they make
                                    purchases with the app.
                                </Paragraph>
                                <Paragraph color={"$neutral11"} fontSize={"$4"}>
                                    Get {user.referralRewardFeePercentage * 100}{" "}
                                    % of the fees from your friend’s
                                    transactions for {user.referralRewardsDays}{" "}
                                    days.
                                </Paragraph>

                                <Paragraph
                                    color={"$neutral13"}
                                    fontWeight={"$2"}
                                    fontSize={"$3"}
                                    marginTop={"$2"}
                                >
                                    For Your Friend
                                </Paragraph>
                                <Paragraph color={"$neutral11"} fontSize={"$4"}>
                                    Enjoy{" "}
                                    {user.discountReferralsPercentage * 100} %
                                    fee discount for{" "}
                                    {user.discountReferralsDays} days.
                                </Paragraph>
                            </YStack>

                            <TamaguiInput
                                label="Your friend's email (optional)"
                                name="email"
                                type="email"
                                value={email}
                                onChange={setEmail}
                            />

                            <TamaguiButton
                                text="Get your link"
                                onClick={handleGetReferralCode}
                                middle
                            />

                            <YStack
                                backgroundColor={"$neutral3"}
                                borderRadius={"$7"}
                                padding={"$4"}
                                gap={"$3"}
                            >
                                <Paragraph
                                    color={"$neutral13"}
                                    fontWeight={"$2"}
                                    fontSize={"$3"}
                                >
                                    Share this link
                                </Paragraph>
                                <XStack alignItems="center" gap={"$3"}>
                                    <YStack flex={1}>
                                        <TamaguiInput
                                            name="referralLink"
                                            type="text"
                                            value={referralLink}
                                            editable={false}
                                        />
                                    </YStack>
                                    <TamaguiIconButton
                                        icon={CopyIcon}
                                        onClick={handleCopy}
                                        backgroundColor={"$pink500"}
                                        size={"44px"}
                                        gap={"$1"}
                                        label={copied ? "Copied" : "Copy"}
                                        colorLabel={"$neutral11"}
                                        fontSizeLabel={"$5"}
                                    />
                                </XStack>
                            </YStack>
                        </YStack>
                    </YStack>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog>
    );
}
