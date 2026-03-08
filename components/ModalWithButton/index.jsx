import {
    customStyles,
    CustomModal,
    ModalContainer,
    CustomText,
    ButtonContainer,
    TextContainer,
} from "./styled";

import { Button } from "../../components/Button";

function ModalWithButton({ content, state, errorModalOnRequestClose }) {
    return (
        <CustomModal
            isOpen={state}
            onRequestClose={errorModalOnRequestClose}
            style={customStyles}
        >
            <ModalContainer>
                <TextContainer>
                    <CustomText>{content.message}</CustomText>
                    <CustomText>{content.secondMessage}</CustomText>
                </TextContainer>
                <ButtonContainer>
                    {content.secondaryButtonState ? (
                        <Button
                            secondary={true}
                            onClick={content.secondaryButtonOnClick}
                            text={content.secondaryButton}
                        />
                    ) : (
                        ""
                    )}
                    <Button
                        onClick={content.primaryButtonOnClick}
                        text={content.primaryButton}
                    />
                </ButtonContainer>
            </ModalContainer>
        </CustomModal>
    );
}
export default ModalWithButton;
