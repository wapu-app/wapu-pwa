import styled from "styled-components";
import Link from "next/link";
export const CustomDetail = styled.div`
    width: 90%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
    background: #0b0b0b;
    margin: 2rem 0;
    position: relative;
`;
export const CustomScreenContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #0b0b0b;
`;
export const CustomAmountContainer = styled.div`
    width: 100%;
    height: auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
`;
export const CustomDetailTexts = styled.div`
    width: 95%;
    height: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
    padding: 2rem 0.5rem;
    border-radius: 15px;
    margin-top: 0.3rem;
    border: 1px solid #b5179e;
`;
export const CustomDetailContainer = styled.div`
    width: 100%;
    height: auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
`;
export const CustomFeeTexts = styled.div`
    width: 95%;
    height: 30%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;
export const CustomLink = styled(Link)`
    text-decoration: none;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
`;
export const ContainerInfo = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
`;

export const CustomText = styled.p`
    font-size: 1rem;
    word-wrap: break-word;
    margin: 0;
    margin-bottom: 1rem;
    text-align: center;
`;
export const CustomPText = styled.p`
    font-size: 0.9rem;
    margin: 0;
    color: #fafafa;
    text-align: center;
`;
export const CustomPTextMin = styled.p`
    font-size: 0.7rem;
    margin: 0;
    text-align: right;
`;
export const CustomTitle = styled.h2`
    font-size: 1.5rem;
    margin: 0;
    text-align: center;
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
export const ButtonContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
`;

export default Spinner;
