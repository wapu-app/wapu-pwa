import {
    customStyles,
    CustomModal,
    ModalContainer,
    CustomText,
} from "./styled";

function ErrorModal({ message, state, errorModalOnRequestClose }) {
    return (
        <CustomModal
            isOpen={state}
            onRequestClose={errorModalOnRequestClose}
            style={customStyles}
        >
            <ModalContainer>
                <CustomText>{message}</CustomText>
            </ModalContainer>
        </CustomModal>
    );
}
export default ErrorModal;
