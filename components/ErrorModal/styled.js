import styled from "styled-components";
import Modal from "react-modal";

export const ModalContainer = styled.div``;

export const CustomText = styled.label`
    color: white;
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
        zIndex: "4",
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
    background-color: rgba(32, 32, 32, 0.6);
    border-radius: 50px;
    padding: 20px 0px;
    transform: "translate(-50%, -50%)";
    border: 1px solid black;
`;
