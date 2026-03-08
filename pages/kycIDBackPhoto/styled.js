import styled from "styled-components";

export const InputContainer = styled.div`
    height: 350px;
    width: 330px;
    display: flex;
    align-items: flex-end;
`;

export const CustomTitle = styled.h3`
    margin: 0;
    margin-bottom: 1rem;
`;
export const CustomDescription = styled.p`
    margin: 0.5rem 0;
    font-size: 0.9rem;
`;

export const ImgContainer = styled.div`
  text-align: center;
  align-items: center;
  justify-content: bottom;
  display: flex
  width: 330px;
  height: 350px;
  position: relative
`;
export const Form = styled.form``;

export const FormContainer = styled.div``;
export const ButtonContainer = styled.div`
    display: flex;
    gap: 10px;
    padding-top: 16px;
    width: 100%;
`;
export const WebcamContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

export const Container = styled.div`
    display: flex;
    flex-direction: column;
`;

export const CenterContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    width: 100%;
`;

export default InputContainer;
