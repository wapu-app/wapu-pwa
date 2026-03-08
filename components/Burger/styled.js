import styled from "styled-components";
import Modal from "react-modal";
import Image from "next/image";
import Link from "next/link";

export const BurgerButton = styled.div`
    padding: 10px;
    border-color: transparent;
    border-radius: 15px;
    border: 1px solid #341931;
    background: #0b0b0b;
    box-shadow: 2px 5px 20px 0px rgba(255, 91, 239, 0.5);
    margin: 1em;
`;

export const Toggle = styled.div`
    position: relative;
    width: 30px;
    height: 30px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition-duration: 0.3s;
    &:hover {
        scale: 1.05;
    }
`;

export const CloseModal = styled.button`
    position: absolute;
    top: 2.5em;
    right: 1.5em;
    padding: 10px 10px;
    border-radius: 10px 10px 10px 10px;
    width: 40px;
    height: 40px;
    font-size: 1em;
    box-shadow: 2px 5px 20px 0px rgba(255, 91, 239, 0.5);
    color: var(--dark);
    border: none;
    cursor: pointer;
`;
export const WindowModal = styled(Modal)`
    height: 100%;
    width: 100%;
    overflow-y: scroll;
    overflow-x: hidden;
    position: relative;
    display: flex;
    align-items: center;
    flex-direction: column;
    background-color: black;
`;

export const CustomIcon = styled(Image)`
    margin: 0 10px;
`;
export const XIcon = styled(Image)``;

export const customStyles = {
    overlay: {
        backgroundColor: "rgba(32, 32, 32, 0.1)",
    },
    content: {
        height: "100%",
        width: "100%",
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        border: "1px solid #ccc",
        zIndex: "3",
    },
};

export const AccountMenu = styled.div`

  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 3em;
  padding-bottom: 1rem;
  & > :first-child {
    margin-top: 4em;
  }

  @media (max-width: 480px) {
    width: 100%;
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
}
`;

export const MenuButton = styled.button`
    margin-top: 1em;
    font-family: ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono",
        "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro",
        "Fira Mono", "Droid Sans Mono", "Courier New", monospace;
    font-size: 0.8em;
    display: flex;
    justify-content: left;
    align-items: center;
    left: 2.4em;
    width: 90%;
    height: 3.4em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: 0.4s ease-in-out;
    box-shadow: 1px 2px 3px #b5b5b5, -1px -1px 3px #ffffff;
    transition-duration: 0.1s;
    &:hover {
        scale: 1.03;
    }
    a {
        display: flex;
        align-items: center;
        width: 100%;
        height: 100%;
    }
`;
export const CustomLink = styled(Link)`
    text-decoration: none;
    color: inherit;
    &:visited {
        color: inherit;
    }
`;

export const Bars = styled.div`
    width: 100%;
    height: 4px;
    background-color: #ececec;
    border-radius: 5px;
`;
export const BurgerContainer = styled.div`
    display: none;
    @media (max-width: 1023px) {
        display: block;
    }
`;
