import styled from "styled-components";

export const Container = styled.div`
    width: 90%;
    height: 70%;
    display: flex;
    flex-direction: column;
    text-align: center;
    justify-content: space-between;
`;
export const TextContainer = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
`;
export const CustomTitle = styled.h3``;
export const PText = styled.p`
    word-wrap: break-word;
`;
export const ButtonContainer = styled.div`
    display: flex;
    gap: 16px;
`;
export const Spinner = styled.div`
    align: center;
    border: 4px solid rgba(0, 0, 0, 0.1);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border-top: 4px solid rgba(255, 91, 239, 0.5);
    animation: spin 1s linear infinite;

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
`;

export default Container;
