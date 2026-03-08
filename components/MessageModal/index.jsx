import React, { useEffect } from "react";
import { ModalWrapper, ModalContent } from "./styled";

const MessageModal = ({ onClose, children }) => {
    // Close the modal if user clicks outside the content area
    const handleOutsideClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose(); // Call the onClose function passed as prop
        }
    };

    // Close the modal when pressing the Esc key
    const handleEscapeKey = (e) => {
        if (e.key === "Escape") {
            onClose(); // Call the onClose function passed as prop
        }
    };

    // Attach event listeners when the component mounts
    useEffect(() => {
        document.addEventListener("keydown", handleEscapeKey);
        return () => {
            document.removeEventListener("keydown", handleEscapeKey);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <ModalWrapper onClick={handleOutsideClick}>
            <ModalContent>{children}</ModalContent>
        </ModalWrapper>
    );
};

export default MessageModal;
