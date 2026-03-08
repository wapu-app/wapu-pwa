import styled from "styled-components";

export const InputContainer = styled.div`
    height: 350px;
    width: 330px;
    display: flex;
    align-items: flex-end;
`;
export const Container = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;
export const CustomTitle = styled.h3``;
export const CustomDescription = styled.p``;

export const ImgContainer = styled.div`
  text-align: center;
  align-items: center;
  justify-content: bottom;
  display: flex
  width: 330px;
  height: 350px;
  position: relative
`;

export const ButtonsContainer = styled.div``;
export const Form = styled.form``;

export const FormContainer = styled.div``;
export const ButtonContainer = styled.div`
    display: flex;
    gap: 16px;
    padding-top: 16px;
    padding-bottom: 16px;
    flex-direction: column;
    width: 100%;
`;
export const WebcamContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

export const GeneralContainer = styled.div`
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
