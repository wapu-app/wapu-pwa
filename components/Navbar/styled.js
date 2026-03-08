import styled, { keyframes } from "styled-components";
const animateBG = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

export const NavbarContainer = styled.nav`
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 30%;
    display: flex;
    flex-direction: column;
    justify-content: space-bebtween;
    background-size: 200% 200%;
    background-image: linear-gradient(
        -295deg,
        #f72585 0%,
        #b5179e 25%,
        #7209b7 50%,
        #7209b7 75%,
        #f72585 100%
    );
    box-shadow: 2px 5px 20px 0px rgba(255, 91, 239, 0.5);
    animation: ${animateBG} 10s ease infinite;
    @media (max-width: 1023px) {
        display: none;
    }
`;

export const NavbarLogo = styled.h1`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    height: 18%;
    border-bottom: 0.5px solid white;

    &:hover img {
        transform: scale(1.05);
    }
`;

export const NavbarButton = styled.button`
    width: 100%;
    height: 68px;
    display: flex;
    align-items: center;
    justify-content: left;
    border: none;
    background-color: transparent;
    font-size: 16px;
    color: white;
    cursor: pointer;
    &:hover {
        transform: scale(1.05);
        color: lightgrey;
        text-shadow: 0 0 18px rgba(192, 192, 192, 0.8);
    }
`;
export const NavbarButtonContainer = styled.div`
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    overflow-x: hidden;
`;
