import styled, { keyframes } from "styled-components";
import Modal from "react-modal";
export const CustomModal = styled(Modal)`
    display: flex;
    flex: 1;
    flex-direction: column;
    width: 100%;
    height: 100%;
    align-self: center;
    align-items: center;
    justify-content: center;
    position: "absolute";
    top: "50%";
    left: "50%";
    background-color: rgba(32, 32, 32, 0.6);
    border-radius: 1rem;
    padding: 20px 0px;
    transform: "translate(-50%, -50%)";
    border: 1px solid black;
`;
export const ModalContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    @media (max-width: 480px) {
        width: 85%;
    }

    @media (min-width: 480px) {
        width: 80%;
    }
    @media (min-width: 480px) {
        width: 80%;
    }

    @media (min-width: 768px) {
        width: 58%;
    }

    @media (min-width: 1025px) {
        width: 50%;
    }
`;
export const customStyles = {
    overlay: {
        backgroundColor: "rgba(32, 32, 32, 0.5)",
    },
    content: {
        width: "80%",
        height: "30%",
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        border: "1px solid rgba(255, 91, 239, 0.50)",
        background: "#020202",
        color: "#fafafa",
    },
};
export const ButtonContainer = styled.div`
    width: 100%;
    height: 80%;
    display: flex;
    flex-direction: column;
    justify-content: end;
`;
export const Ptext = styled.p`
    color: white;
    font-size: 18px;
    text-align: right;
`;
const fadeInFrames = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;
const zoomAnimation = keyframes`
  0% {
    transform: scale(0.8);
  }
  100% {
    transform: scale(1.2);
  }
`;

export const PrincipalContainer = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #020202;

    @media (min-width: 1024px) {
        width: 100%;
    }
`;

export const CustomMain = styled.main`
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    font-family: ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono",
        "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro",
        "Fira Mono", "Droid Sans Mono", "Courier New", monospace;
    color: white;
    overflow: scroll; // Added scroll
    @media (min-width: 1024px) {
        max-width: 35%;
        height: 100%;
        margin: 0;
        justify-content: space-evenly;
        overflow-y: auto;
        padding: 0 1.5rem;
    }
`;

export const Message = styled.div`
  color: white;
  font-family:  ui-monospace
  line-height: 27px;
  font-size: 18px;
  text-align: right;
  pointer-events: none;
  opacity: 0;
  animation: ${fadeInFrames} ${5000}ms linear forwards;
`;

export const Stars = styled.div`
    position: fixed;
    top: 50%;
    left: 50%;
    height: 1px;
    width: 1px;
    border-radius: 50%;
    box-shadow: -24vw -44vh 2px 2px white, 38vw -4vh 0px 0px white,
        -20vw -48vh 1px 2px white, -39vw 38vh 3px 1px white,
        -42vw -11vh 0px 3px white, 12vw 15vh 3px 3px white,
        42vw 6vh 3px 2px white, -8vw 9vh 0px 2px white, 34vw -38vh 1px 0px white,
        -17vw 45vh 3px 1px white, 22vw -36vh 3px 2px white,
        -42vw 1vh 1px 0px white;

    animation: ${zoomAnimation} 8s alternate infinite;
`;

export const NavigationContainer = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
    border-top: 1px solid #341931;
    box-shadow: rgba(255, 91, 236, 0.5);
    padding-top: 5%;

`;

export const HiddenNavigation = styled.div`
    display: "none";
    z-index: 2;
`;
export const LogoContainer = styled.div`
    width: auto;
    height: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 15%;
`;
