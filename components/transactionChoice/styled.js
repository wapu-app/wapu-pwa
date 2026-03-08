import styled from "styled-components";
import Image from "next/image";
import Modal from "react-modal";

export const CustomModal = styled(Modal)`
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-self: center;
    align-items: center;
    justify-content: center;
    position: "absolute";
    top: "50%";
    left: "50%";
    background-color: rgba(32, 32, 32, 0.6);
    transform: "translate(-50%, -50%)";
    border: 1px solid black;
`;
export const customStyles = {
    overlay: {
        backgroundColor: "rgba(32, 32, 32, 0.5)",
    },
    content: {
        height: "100%",
        width: "100%",
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "#0b0b0b",
        color: "#fafafa",
    },
};

export const CloseModal = styled.button`
    position: absolute;
    top: 2.5em;
    right: 1.5em;
    padding: 10px 10px;
    border-radius: 10px 10px 10px 10px;
    width: 40px;
    height: 40px;
    font-size: 1em;
    box-shadow: 2px 5px 20px 0px rgba(255, 91, 239, 0.5);
    color: var(--dark);
    border: none;
    cursor: pointer;
    z-index: 3;
`;

export const Container = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: top;
    align-items: top;
    width: 100%;
    position: relative;
    padding-top: 7em;
`;

export const Title = styled.p`
    text-align: left;
    margin: 0;
`;
export const SubTitle = styled.p`
    text-align: left;
    opacity: 0.4;
    font-size: 0.9em;
    margin-top: 0.3em;
`;

export const SectionContainer = styled.div`
    height: auto;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-top: 10px;
`;

export const TextContainer = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
`;

export const ContainerIcon = styled.div`
    display: flex;
    height: 100%;
    width: 85px;
    justify-content: center;
`;

export const Icon = styled(Image)``;
