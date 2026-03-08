import styled from "styled-components";
import Image from "next/image";

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    text-align: center;
    justify-content: space-between;
    align-items: center;
    padding: 2rem 0;

    @media (max-width: 480px) {
        width: 90%;
        height: 100%;
        margin-right: 0;
    }

    @media (min-width: 480px) {
        width: 90%;
    }

    @media (min-width: 768px) {
        width: 86%;
    }

    @media (min-width: 1024px) {
        width: 74%;
    }
`;
export const ContainerConfirm = styled.div`
    width: 90%;
    height: 100%;
    display: flex;
    flex-direction: column;
    text-align: center;
    justify-content: space-between;
    align-items: center;
    padding: 2rem 0;
`;
export const TextContainer = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
`;
export const QRContainer = styled.div`
    width: fit-content;
    height: auto;
    display: flex;
    justify-content: center;
    border: 2px solid rgba(255, 91, 239, 0.5);
    border-radius: 2px;
    margin-bottom: 1rem;
`;

export const InputContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
`;
export const Form = styled.form`
    width: 100%;
`;

export const FormContainer = styled.div`
    display: flex;
`;
export const CustomTitle = styled.h3`
    margin: 0;
`;

export const PText = styled.p`
    text-align: start;
    font-size: 15px;
    word-wrap: break-word;
    margin: 0;
    margin-right: 10px;
    margin-top: 10px;
    margin-bottom: 10px;
`;
export const PTextMin = styled.p`
    width: 100%;
    font-size: 12px;
    color: white;
    text-align: justify;
`;
export const ButtonContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
`;
export const CustomIcon = styled(Image)`
    margin: 0 10px;
`;
export const CopyButton = styled.button`
    position: absolute;
    display: flex;
    border-radius: 5px;
    box-shadow: 0px 2px 3px #b5b5b5, 0px 0px 0px #ffffff;
    border: none;
    cursor: pointer;
    margin-left: auto;
    align-self: flex-end;
    height: 40px;
    align-items: center;
    border-left: 2px solid #ccc;
    transition: 0.1s ease;
    &:hover {
        cursor: pointer;
    }
    &:active {
        background: #ccc;
    }
`;

export const NetworkContainer = styled.div`
    display: flex;
    width: 100%;
    height: auto;
    flex-direction: column;
    margin: 20px 0;
`;
export const ContentContainer = styled.div`
    width: auto;
    display: flex;
    justify-content: space-between;
`;
export const CustomP = styled.div`
    width: auto;
`;
export const ContainerX = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
`;
export const ContainerY = styled.div`
    width: 100%;
`;
export const Spinner = styled.div`
    align: center;
    border: 4px solid rgba(0, 0, 0, 0.1);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border-top: 4px solid rgba(255, 91, 239, 0.5); /* color del spinner */
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
