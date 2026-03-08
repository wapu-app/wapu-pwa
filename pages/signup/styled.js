import styled from "styled-components";

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    position: fixed;
    bottom: 10%;
    height: 40%;

    @media (max-width: 480px) {
        width: 90%;
        height: auto;
        margin-right: 0;
    }

    @media (min-width: 480px) {
        width: 70%;
    }

    @media (min-width: 768px) {
        width: 55%;
    }

    @media (min-width: 1024px) {
        width: 40%;
    }
`;

export default Wrapper;
