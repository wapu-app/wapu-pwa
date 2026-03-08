import Link from "next/link";
import styled from "styled-components";
export const SectionContainer = styled.section`
    height: 100%;
    width: 90%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    margin: 0 auto;
    padding: 2rem 0;
`;

export const Title = styled.h1`
    text-align: center;
`;
export const SubTitle = styled.h3`
    text-align: center;
`;

export const Check = styled.p`
    font-size: 5rem;
    margin: 0;
    animation: pulse 2s infinite;
    &:before {
        content: "🎉";
    }
    @keyframes pulse {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
        }
        100% {
            transform: scale(1);
        }
    }
`;

export const Cancel = styled.p`
    font-size: 5rem;
    margin: 0;
    animation: pulse 2s infinite;
    &:before {
        content: "❌";
    }
    @keyframes pulse {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
        }
        100% {
            transform: scale(1);
        }
    }
`;

export const Support = styled.p`
    text-align: center;
    &:before {
        content: "💬 ";
    }
`;

export const StyledLink = styled(Link)`
    color: white;
    align-items: center;
    width: 100%;
    height: 100%;
`;
export const ButtonContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
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

export default SectionContainer;
