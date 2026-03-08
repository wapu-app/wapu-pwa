import styled from "styled-components";

export const InputContainer = styled.div`
    display: flex;
    align-items: center;
    border: 2px solid #ccc;
    border-radius: 4px;
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 10px;
    background: white;
`;
export const Input = styled.input`
    width: 100%;
    font-size: 14px;
    padding: 10px;
    border: none;
`;
export const Max = styled.div`
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: black;
    padding: 0.5rem;
    border-left: 2px solid #ccc;
    transition: 0.1s ease;
    &:hover {
        cursor: pointer;
    }
    &:active {
        background: #ccc;
    }
`;
