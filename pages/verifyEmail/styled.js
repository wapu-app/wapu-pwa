import styled from "styled-components";
import Modal from "react-modal";

export const CustomTitle = styled.h3`
    color: white;
`;

export const CustomContainer = styled.div`
    height: 50vh;
    width: 90%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
`;

export const CenterContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 50%;
`;

export const ButtonContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 50%;
`;

export const CustomText = styled.p`
    font-size: 1rem;
    word-wrap: break-word;
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

export const ModalContainer = styled.div`
    width: 80%;
`;

export const Form = styled.form``;

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

export default CustomContainer;
