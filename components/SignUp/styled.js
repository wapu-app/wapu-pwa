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

export const SignupForm = styled.div`
    height: 100%;
    position: relative;
    flex-direction: column;
    display: flex;
    align-items: center;
`;

export const CustomLabel = styled.label`
    color: white;
`;
export const CustomText = styled.label`
    color: white;
`;

export const FormContainer = styled.div``;
export const ButtonContainer = styled.div`
    display: flex;
    gap: 16px;
`;
export const UnRegisterAccount = styled.div``;
export const RegisterContainer = styled.div``;
export const ModalContainer = styled.div`
    width: 80%;
`;
export const PTextMin = styled.p`
    width: 100%;
    font-size: 14px;
    margin: 0;
    color: #fafafa;
`;
export const ReferralContainer = styled.div`
    width: 100%;
    height: auto;
    display: flex;
    align-items: center;
`;
export const CustomTerms = styled.a`
    color: #ffbcf5;
    margin: 0 2px
`;
export const Input = styled.input`
    width: 1.5rem;
    height: 1.5rem;
    margin: 2px;
`;
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
