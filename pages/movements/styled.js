import styled from "styled-components";

export const CustomContainer = styled.div`
    height: 47vh;
    width: 95%;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: scroll;
    overflow-x: hidden;
    padding-top: 2%;

    @media (max-width: 480px) {
        height: 70vh;
        padding-top: none;
    }
`;
export const CustomText = styled.p`
    font-size: 1rem;
    word-wrap: break-word;
`;
export const Spinner = styled.div`
    align: center;
    margin-top: 30%;
    border: 4px solid rgba(0, 0, 0, 0.1);
    width: 50px;
    height: 50px;
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

export default CustomContainer;
