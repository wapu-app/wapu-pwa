import styled from "styled-components";
import Modal from "react-modal";

export const CustomTitle = styled.h3`
    color: white;
    margin: 0;
`;

export const CustomContainer = styled.div`
    width: 90%;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

export const CenterContainer = styled.div`
    height: 50vh;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
`;

export const ButtonContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

export const CustomText = styled.p`
    font-size: 1rem;
    word-wrap: break-word;
`;

export const Form = styled.form`
    height: 60%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;

export default CustomContainer;
