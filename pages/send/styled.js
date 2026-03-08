import styled from "styled-components";

export const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 1rem;
`;
export const SendForm = styled.div`
    width: 90%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    padding: 2rem 0;
`;

export const CustomTitle = styled.h3`
    font-size: 24px;
    margin: 0;
`;

export const Form = styled.form``;

export const FormContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;
export const ButtonContainer = styled.div`
    width: 100%;
    display: flex;
    gap: 16px;
`;
export const LinkWhite = styled.div`
    color: rgb(255, 255, 255);
    text-decoration: underline;
`;
export const ContainerSend = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
`;
export const InfoContainer = styled.div`
  width: 100%
  text-align: left;
  flex: 1;
  flex-direction: column;
  margin: 15;
`;
export const Text = styled.p`
    height: auto;
    margin: 10;
`;

export const PTextMin = styled.p`
    font-size: 12px;
    color: white;
    text-align: justify;
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
export const DataContainer = styled.div`
    width: 100%;
    height: 40%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
`;
export const PText = styled.p`
    margin: 0;
`;
export const ContainerY = styled.div`
    height: auto;
    width: 100%;
`;
export default InputContainer;
