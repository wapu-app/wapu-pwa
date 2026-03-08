import styled from "styled-components";
import Modal from "react-modal";

export const ModalContainer = styled.div`
    width: 100%;
    height: 30vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
    gap: 10px;
`;

export const CustomText = styled.label`
    color: white;
`;
export const TextContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
`;
export const ButtonContainer = styled.div`
    width: 100%;
    display: flex;
    gap: 10px;
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
        border: "1px solid rgba(255, 91, 239, 0.5)",
        padding: "1rem",
    },
};

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
    background-color: rgba(32, 32, 32);
    border-radius: 1rem;
    padding: 20px 0px;
    transform: "translate(-50%, -50%)";
    border: 1px solid black;
`;
