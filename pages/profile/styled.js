import styled from "styled-components";

export const Container = styled.div`
    height: 100%;
    width: 90%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 2rem 0;
`;
export const FormContainer = styled.div`
    height: 70%;
    border-radius: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    padding: 1rem;
`;
export const ContainerIcon = styled.div`
    display: none;

    @media (max-width: 1023px) {
        display: block;
        position: absolute;
        left: 16px;
        top: 50px;
    }
`;
export const ContainerButton = styled.div`
    width: 100%;
    display: flex;
    gap: 0.5rem;
`;
export const Containerinput = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
`;
export const Input = styled.input`
    font-size: 14px;
    padding: 10px;
    background: #eee;
    border-radius: 8px;
    border: none;
`;
export const UsernameInput = styled.input`
    font-size: 14px;
    padding: 10px;
    background: #eee;
    border-radius: 8px;
    border: none;
    flex-grow: 1;
`;
export const CustomDescription = styled.p`
    margin: 0;
    padding-bottom: 8px;
    font-size: 14px;
`;
export const CustomTitle = styled.h3`
    margin: 0;
`;
export const UsernameContainer = styled.div`
    display: flex;
    align-items: center;
`;

export default Container;
