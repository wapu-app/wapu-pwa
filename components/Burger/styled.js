import styled from "styled-components";
import Modal from "react-modal";
import Image from "next/image";
import Link from "next/link";

export const MobileTrigger = styled.span`
    display: inline-flex;

    @media (min-width: 1024px) {
        display: none;
    }
`;

// NOTE: these exports are still consumed by components/Referral/referral.jsx
// and components/Navbar/index.jsx (both legacy, out of scope for this
// redesign). Keep them intact until those components are migrated.

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

export const CustomIcon = styled(Image)`
    margin: 0 10px;
`;
export const XIcon = styled(Image)``;

export const CustomLink = styled(Link)`
    text-decoration: none;
    color: inherit;
    &:visited {
        color: inherit;
    }
`;
