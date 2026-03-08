import styled from "styled-components";
import Link from "next/link";
import Modal from "react-modal";
Modal.setAppElement("body");

export const ModalContainer = styled.div`
    width: 100%;
    height: 90%;
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: space-between;
    overflow-y: scroll;
    font-family: ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono",
        "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro",
        "Fira Mono", "Droid Sans Mono", "Courier New", monospace;
`;
export const StyledButton = styled(Link)`
    display: flex;
    width: 95%;
    border: 2px solid #1a1a21;
    align-items: center;
    justify-content: center;
    padding: 1rem 0;
    border-radius: 2rem;
    text-decoration: none;
    color: #1a1a21;
`;
export const CustomText = styled.p`
    width: 100%;
    color: #272730;
    text-align: start;
    margin: 0;
    margin-bottom: 1rem;
    font-size: 0.9rem;
`;
export const ContainerText = styled.div`
    display: flex;
    flex-direction: column;
    height: auto;
    width: 95%;
    align-items: start;
    justify-content: start;
    line-height: 135%;
`;
export const CustomTitle = styled.h2`
    color: #1a1a21;
`;
export const CustomSubtitle = styled.h4`
    width: 100%;
    color: #272730;
    text-align: start;
    margin: 0;
    margin-bottom: 1rem;
`;
export const CustomBack = styled.p`
    margin: 0;
    position: absolute;
    top: 0;
    right: 0;
    font-size: 1.5rem;
    font-family: ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono",
        "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro",
        "Fira Mono", "Droid Sans Mono", "Courier New", monospace;
    color: #1a1a21;
    padding: 1rem 1.5rem;
`;
export const customStyles = {
    overlay: {
        backgroundColor: "rgba(32, 32, 32, .6)",
        zIndex: 3,
    },
    content: {
        position: "absolute",
        bottom: "0%",
        left: "50%",
        transform: "translate(-50%, -0%)",
        width: "95%",
        border: "2px solid black",
        padding: "1rem",
    },
};
export const CustomModal = styled(Modal)`
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100vw;
  height: 80vh;
  align-self: center;
  align-items: center;
  justify-content: center;
  position: 'absolute';
  bottom: '0%';
  left: '50%';
  background-color: #fafafa;
  padding: 20px 0px;
  transform: 'translate(-50%, -0%)'
  border: 1px solid black;
`;
