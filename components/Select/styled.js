import styled from "styled-components";

export const Select = styled.select`
    border: 2px solid #ccc;
    border-radius: 4px;
    padding: 10px;
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 10px;
    font-size: 14px;

    &:disabled {
        background-color: #ffffff; // Keep the color unchanged when disabled
    }
`;
