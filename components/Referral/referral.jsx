"use client";
import { useState, useEffect } from "react";
import { Dialog, YStack, XStack, Paragraph } from "tamagui";

import TamaguiInput from "../TamaguiInput";
import TamaguiButton from "../TamaguiButton";
import CopyButton from "../CopyButton";
import NewHeaderButton from "../newHeaderButton";

import { getReferralCode } from "../../api/api";
import { useUserContext } from "../../context/userContext";

export default function Referral({ isOpen, setIsOpen }) {
    const [email, setEmail] = useState("");
    const [referralLink, setReferralLink] = useState("");
    const { user } = useUserContext();

    const handleGetReferralCode = async () => {
        try {
            const { data } = await getReferralCode(email, "");
            setReferralLink(data.referral_link);
        } catch (error) {
            console.error(error.message);
        }
    };

    // The dialog stays mounted while closed (one instance behind the home
    // "Earn" button, another behind the menu's "Invitations" row), so a mount
    // effect meant every visit to /home fired POST /users/referral once per
    // instance — twice each under StrictMode. Ask for the link when it is
    // actually opened, and only if we do not have one yet; the "Get your link"
    // button covers a re-fetch after the email changes.
    useEffect(() => {
        if (isOpen && !referralLink) {
            handleGetReferralCode();
        }
    }, [isOpen]);

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
                                    <CopyButton
                                        value={referralLink}
                                        backgroundColor={"$pink500"}
                                        size={"44px"}
                                        gap={"$1"}
                                        label={"Copy"}
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
