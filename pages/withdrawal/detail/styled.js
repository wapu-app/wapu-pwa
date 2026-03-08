import styled from "styled-components";

export const MainContainer = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 2rem 0;
`;
export const CustomTitle = styled.h3`
    margin: 0;
`;
export const ContainerInfo = styled.div`
    height: 60%;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: center;
`;

export const Check = styled.h5`
    font-size: 3rem;
    margin: 0;
`;
export const Texts = styled.div`
    height: 3rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;

export const Text = styled.p`
    font-size: 1rem;
    margin: 0;
    text-align: center;
`;
export const TextMin = styled.p`
    font-size: 0.9rem;
    margin: 0;
    text-align: center;
`;
export default MainContainer;
