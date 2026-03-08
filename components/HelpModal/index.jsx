import React from "react";
import {
    ModalContainer,
    customStyles,
    CustomModal,
    CustomText,
    CustomTitle,
    CustomSubtitle,
    StyledButton,
    ContainerText,
    CustomBack,
} from "./styled";
function HelpModal({ href, message, state, helpModalOnRequestClose }) {
    return (
        <CustomModal
            isOpen={state}
            onRequestClose={helpModalOnRequestClose}
            style={customStyles}
        >
            <CustomBack onClick={helpModalOnRequestClose}>X</CustomBack>
            <ModalContainer>
                <CustomTitle>{message.title}</CustomTitle>
                <ContainerText>
                    <CustomSubtitle>{message.subtitle}</CustomSubtitle>
                    <CustomText>{message.subtitle1}</CustomText>
                </ContainerText>
                <ContainerText>
                    <CustomText>{message.content1}</CustomText>
                    <CustomText>{message.content2}</CustomText>
                    <CustomText>{message.content3}</CustomText>
                </ContainerText>
                <StyledButton href={message.href} target={message.target}>
                    {message.text_button}
                </StyledButton>
            </ModalContainer>
        </CustomModal>
    );
}
export default HelpModal;
