import { useEffect } from "react";
import { useRouter } from "next/router";
import { useUserContext } from "../../context/userContext";
import ArrowRight from "../../public/icons/chevron_right_white_24dp.svg";
import Forward from "../../public/icons/arrow_forward_white_24dp.svg";
import Bolt from "../../public/icons/bolt_white_24dp.svg";
import LeftRightArrows from "../../public/icons/faster-arrow-left-right-icon.svg";
import Close from "../../public/icons/close_black.svg";
import {
    SectionContainer,
    Title,
    SubTitle,
    Container,
    ContainerIcon,
    Icon,
    TextContainer,
    CustomModal,
    customStyles,
    CloseModal,
} from "./styled";

export const TransactionChoiceModal = ({ isOpen, close }) => {
    const { user, getUser } = useUserContext();

    useEffect(() => {
        getUser();
    }, []);

    const router = useRouter();

    const handleRegularSend = () => {
        close();
        router.push("/send?mode=regular");
    };

    const handleFastSend = () => {
        close();
        router.push("/send?mode=fast");
    };

    const handleWapuUserSend = () => {
        close();
        router.push("/innerTransfer");
    };

    return (
        <CustomModal
            isOpen={isOpen}
            onRequestClose={() => close()}
            style={customStyles}
        >
            <CloseModal onClick={() => close()}>
                <Icon width={20} height={20} src={Close} alt={"Close"} />
            </CloseModal>
            <Container>
                {user.fiatTransfer ? (
                    <SectionContainer onClick={handleRegularSend}>
                        <ContainerIcon>
                            <Icon
                                width={35}
                                height={35}
                                src={Forward}
                                alt="forward icon"
                            />
                        </ContainerIcon>
                        <TextContainer>
                            <Title>Send Money</Title>
                            {typeof user.fiatTransferFee !== "undefined" ? (
                                <SubTitle>
                                    Up to 24hs to complete.{" "}
                                    {parseFloat(user.fiatTransferFee) * 100}%
                                    fee.
                                </SubTitle>
                            ) : (
                                <SubTitle>Up to 24hs to complete.</SubTitle>
                            )}
                        </TextContainer>
                        <ContainerIcon onClick={handleRegularSend}>
                            <Icon
                                width={35}
                                height={35}
                                src={ArrowRight}
                                alt="Continue"
                            />
                        </ContainerIcon>
                    </SectionContainer>
                ) : (
                    <></>
                )}
                {user.fastFiatTransfer ? (
                    <SectionContainer onClick={handleFastSend}>
                        <ContainerIcon>
                            <Icon
                                width={35}
                                height={35}
                                src={Bolt}
                                alt="bolt icon"
                            />
                        </ContainerIcon>
                        <TextContainer>
                            <Title>Send Money FAST</Title>
                            {typeof user.fastFiatTransferFee != "undefined" ? (
                                <SubTitle>
                                    Up to 2hs to complete.{" "}
                                    {parseFloat(user.fastFiatTransferFee) * 100}
                                    % fee.
                                </SubTitle>
                            ) : (
                                <SubTitle>Up to 2hs to complete.</SubTitle>
                            )}
                        </TextContainer>
                        <ContainerIcon>
                            <Icon
                                width={35}
                                height={35}
                                src={ArrowRight}
                                alt="Continue"
                            />
                        </ContainerIcon>
                    </SectionContainer>
                ) : (
                    <></>
                )}
                {user.sendInnerTransf ? (
                    <SectionContainer onClick={handleWapuUserSend}>
                        <ContainerIcon>
                            <Icon
                                width={35}
                                height={35}
                                src={LeftRightArrows}
                                alt="bolt icon"
                            />
                        </ContainerIcon>
                        <TextContainer>
                            <Title>Send to Wapu user</Title>
                            <SubTitle>Instant free transfer</SubTitle>
                        </TextContainer>
                        <ContainerIcon>
                            <Icon
                                width={35}
                                height={35}
                                src={ArrowRight}
                                alt="Continue"
                            />
                        </ContainerIcon>
                    </SectionContainer>
                ) : (
                    <></>
                )}
            </Container>
        </CustomModal>
    );
};
