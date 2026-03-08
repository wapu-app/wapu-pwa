import styled from "styled-components";
export const Container = styled.div`
    height: 100%;
    width: 90%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 2rem 0;
`;
export const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 34px;
`;

export const CustomTitle = styled.h3`
    font-size: 24px;
`;
export const CenterText = styled.h1`
    margin: 10;
`;

export const CenterContainer = styled.div`
  display:flex
  flex: 1;
  text-align: center;
  justify-content: center; 
  align-items: center
`;
export const Form = styled.form``;

export const ButtonContainer = styled.div`
    width: 100%;
    display: flex;
    gap: 16px;
`;
export const InfoContainer = styled.div`
    width: 100%;

    flex-direction: column;
    text-align: left;
    flex: 1;
    flex-direction: column;
    margin: 15;
`;
export const Text = styled.p`
    height: auto;
    margin: 10;
`;
export const TextMin = styled.p`
    color: #fad4d4;
    width: 90%;
    height: auto;
    font-size: 14px;
    text-align: center;
`;
export const PTextMin = styled.p`
    font-size: 12px;
    color: white;
    text-align: justify;
`;
export default InputContainer;
