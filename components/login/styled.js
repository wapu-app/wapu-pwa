import styled from "styled-components";
import Modal from "react-modal";

export const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 26px;
`;

export const CustomTitle = styled.h3`
    color: white;
`;

export const Form = styled.form``;

export const CustomLabel = styled.label`
    color: white;
`;
export const CustomText = styled.p``;
export const CustomLink = styled.a`
    color: #fe0176;
`;

export const FormContainer = styled.div``;
export const ButtonContainer = styled.div`
    display: flex;
    gap: 16px;
`;

export const UnRegisterAccount = styled.div``;

export const LoginContainer = styled.div``;
export const ModalContainer = styled.div``;

export const CustomSpan = styled.span``;

export const CustomModal = styled(Modal)`
    display: flex;
    flex: 1;
    flex-direction: column;
    width: 80%;
    align-self: center;
    align-items: center;
    justify-content: center;
    position: "absolute";
    top: "50%";
    left: "50%";
    background-color: rgba(32, 32, 32, 0.6);
    border-radius: 50px;
    padding: 20px 0px;
    transform: "translate(-50%, -50%)";
    border: 1px solid black;
`;

export const customStyles = {
    overlay: {
        backgroundColor: "rgba(32, 32, 32, 0.6)",
    },
    content: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "80%",
        border: "1px solid #ccc",
        padding: "20px",
    },
};
