import styled, { keyframes } from "styled-components";
import Image from "next/image";
import Modal from "react-modal";
export const CustomModal = styled(Modal)`
    display: flex;
    flex: 1;
    flex-direction: column;
    width: 80%;
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
    height: 100%;
    width: 85%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
`;
export const customStyles = {
    overlay: {
        backgroundColor: "rgba(32, 32, 32, 0.5)",
    },
    content: {
        width: "80%",
        height: "auto",
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        border: "1px solid rgba(255, 91, 239, 0.50)",
        background: "#0b0b0b",
        color: "#fafafa",
    },
};
const animateBG = keyframes`{
	0% {
		background-position: 0% 50%;
	}
	50% {
		background-position: 100% 50%;
	}
	100% {
		background-position: 0% 50%;
	}
}
`;
export const Container = styled.div`
    margin-top: 1.5rem;
    margin-bottom: 3rem;
    height: auto;
    display: flex;
    flex-direction: column;
    align-items: center;

    @media (max-width: 480px) {
        width: 90%;
        height: auto;
        margin-right: 0;
    }

    @media (min-width: 480px) {
        width: 96%;
    }

    @media (min-width: 768px) {
        width: 86%;
    }

    @media (min-width: 1024px) {
        width: 100%;
    }
`;
export const CustomText = styled.p`
    white-space: nowrap;
    padding: 0 20px;
`;
export const CustomBalance = styled.p`
    white-space: nowrap;
    padding: 0 20px;
    font-weight: bold;
`;
export const CustomBalanceHidden = styled.p`
    white-space: nowrap;
    padding: 0 20px;
    font-weight: bold;
`;

export const CustomHide = styled.div`
    width: 25px;
`;
export const TextWrapper = styled.div`
    height: auto;
    width: 100%;
    gap: 16px;
    border: 1px solid #646464;
    flex-direction: column;
    align-items: center;
    border-radius: 1rem;
    background-size: 300% 300%;
    background-image: linear-gradient(
        -295deg,
        #f72585 0%,
        #b5179e 25%,
        #7209b7 50%,
        #7209b7 75%,
        #f72585 100%
    );
    animation: ${animateBG} 10s ease infinite;
    box-shadow: 2px 5px 20px 0px rgba(255, 91, 239, 0.5);
    padding: 20px 0;
`;
export const RateWrapper = styled.div`
  height: auto;
  width: 100%;
  border: 1px solid #646464;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: 0.5rem;
  margin-top: 1rem;
  background-size: 300% 300%;
  );
  box-shadow: 1px 3px 5px 0px rgba(255, 91, 239, 0.50);
`;
export const CustomTextContainer = styled.div`
    display: flex;
    padding-right: 20px;
    justify-content: space-between;
    align-items: center;
`;
export const CustomSelectContainer = styled.div`
    width: 20%;
`;
export const ContainerX = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
`;
export const CustomIcon = styled(Image)`
    margin: 0 20px;
`;
export const RateIcon = styled(Image)`
  margin: 5px; 2px;
  
`;
export const RateText = styled.p`
    margin: 0 0;
    padding: 8px 10px;
`;
export const RateTitleWrap = styled.div`
  height: auto;
  width: 100%;
  margin-top: 1rem;
  display: flex;
  align items: left;
  );
  
`;
export const RateValues = styled.div`
  height: auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  );
  
`;

export default Container;
