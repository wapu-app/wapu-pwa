import styled from "styled-components";

export const ModalWrapper = styled.div`
    position: fixed;
    top: 68%;
    left: -250%;
    width: 300px;
    height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
`;

export const ModalContent = styled.div`
    background-color: white;
    font-weight: bold;
    font-size: 1rem;
    width: 100%;
    padding: 5%;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
`;
