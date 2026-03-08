"use client";
import { useState , useEffect} from "react";
import CopyIcon from "../../public/icons/content_copy_FILL0_wght400_GRAD0_opsz24.svg";
import Close from "../../public/icons/close_black.svg";
import {
    CloseModal,
    customStyles,
    WindowModal,
    CustomIcon,
    XIcon,
} from "../Burger/styled";
import { CustomInput } from "../../components/Input";
import { CustomInputReadOnly } from "../../components/InputReadOnly";
import {
    CopyButton,
    CodeDiv,
    WindowButton,
    InputContainer,
    CustomLabel,
    CustomDescription,
    CustomTitle,
} from "./styled";
import { getReferralCode } from "../../api/api";
import { useUserContext } from "../../context/userContext";

export default function Referral({ isOpen, setIsOpen }) {
    const [referralCode, setReferralCode] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [referralLink, setReferralLink] = useState("");
    const { user } = useUserContext();

    const handleGetReferralCode = async () => {
        try {
            const { data } = await getReferralCode(email, phone);
            setReferralCode(data.referral_code);
            setReferralLink(data.referral_link);
        } catch (error) {
            console.error(error.message);
        }
    };
    useEffect(() => {
        handleGetReferralCode();
    }, []);
    return (
        <>
            <WindowModal
                isOpen={isOpen}
                onRequestClose={() => setIsOpen(false)}
                style={customStyles}
            >
                <CloseModal onClick={() => setIsOpen(false)}>
                    <XIcon width={20} height={20} src={Close} alt={"Close"} />
                </CloseModal>
                <CodeDiv>
                    <CustomTitle>Invite and Earn with Wapu!</CustomTitle>
                    <CustomLabel>For You:</CustomLabel>
                    <CustomDescription>
                        - Get rewarded as soon as they make purchases with the app.
                    </CustomDescription>
                    <CustomDescription>
                        - Get {user.referralRewardFeePercentage*100} % of the fees from your friend’s transactions for {user.referralRewardsDays} days.
                    </CustomDescription>
                    <CustomLabel>For Your Friend:</CustomLabel>
                    <CustomDescription>
                        - Enjoy {user.discountReferralsPercentage*100} % fee discount for {user.discountReferralsDays} days.
                    </CustomDescription>
                    <CustomLabel>Your friend's email:</CustomLabel>
                    <InputContainer>
                        <CustomInput
                            label="Email (optional)"
                            name="email"
                            type={"email"}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </InputContainer>

                    <WindowButton onClick={handleGetReferralCode}>
                        Get your link
                    </WindowButton>

                    <CustomLabel>Share this link:</CustomLabel>
                    <InputContainer>
                        <CustomInputReadOnly
                            label="Referral link"
                            name="referralLink"
                            type="text"
                            value={referralLink}
                            readOnly
                        />
                        <CopyButton
                            onClick={() =>
                                navigator.clipboard.writeText(referralLink)
                            }
                        >
                            <CustomIcon
                                width={22}
                                height={22}
                                src={CopyIcon}
                                alt="Copy to clipboard"
                            />
                        </CopyButton>
                    </InputContainer>
                </CodeDiv>
            </WindowModal>
        </>
    );
}
