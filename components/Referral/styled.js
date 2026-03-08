import styled from "styled-components";
import Modal from "react-modal";

export const CopyButton = styled.button`
    display: flex;
    border-radius: 5px;
    box-shadow: 0px 2px 3px #b5b5b5, 0px 0px 0px #ffffff;
    border: none;
    cursor: pointer;
    margin-left: auto;
    align-self: flex-end;
    position: absolute;
    right: 0px;
    top: 2px;
    height: 37px;
    align-items: center;
    transition: 0.1s ease;
    &:hover {
        cursor: pointer;
    }
    &:active {
        background: #ccc;
    }
`;

export const CustomLabel = styled.label`
    line-height: 27px;
    font-size: 18px;
    pointer-events: none;
`;
export const WindowButton = styled.button`
    display: flex;
    justify-content: center;
    padding: 10px;
    border-radius: 10px;
    box-shadow: 0px 2px 3px #b5b5b5, 0px 0px 0px #ffffff;
    border: none;
    cursor: pointer;
    width: 50%;
    margin-left: auto;
    align-self: flex-end;
`;

export const CodeDiv = styled.div`
    font-family: monospace;
    display: column;
    align-items: center;
    margin-top: 5em;
    font-size: 1.2em;
    color: white;

    @media (max-width: 480px) {
        width: 90%;
    }

    @media (min-width: 480px) {
        width: 70%;
    }

    @media (min-width: 768px) {
        width: 55%;
    }

    @media (min-width: 1024px) {
        width: 40%;
    }
`;

export const InputContainer = styled.div`
    position: relative;
    display: flex;
    flex-direction: row;
    margin-bottom: 2px;
    width: 100%;
`;

export const CustomDescription = styled.p`
    margin: 10px;
    padding-bottom: 8px;
    font-size: 14px;
`;
export const CustomTitle = styled.h3``;
