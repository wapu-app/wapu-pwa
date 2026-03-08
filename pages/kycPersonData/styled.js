import styled from "styled-components";

export const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
`;

export const CustomTitle = styled.h3``;
export const CustomDescription = styled.p``;

export const FormContainer = styled.div`
    width: 100%;
    flex: 1;
    flex-direction: column;
    align-items: start;
    overflow: auto;
    max-height: 65vh;
    padding-right: 10px;
`;

export const Form = styled.div``;

export const ButtonContainer = styled.div`
    display: flex;
    gap: 16px;
`;

export const LinkWhite = styled.div`
    color: rgb(255, 255, 255);
    text-decoration: underline;
`;

export default InputContainer;
