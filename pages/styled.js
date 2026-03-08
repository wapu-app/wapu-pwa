import styled from "styled-components";

export const CustomMain = styled.div`
    display: flex;
    padding: 100px;
    justify-content: center;
    flex-direction: column;
    align-items: center;
`;

export const CustomText = styled.p`
    white-space: nowrap;
`;

export const TextWrapper = styled.div`
    display: flex;
    gap: 20px;
    border: 1px solid #202020;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 1rem;
`;
export default CustomMain;
