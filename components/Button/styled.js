import Link from "next/link";
import styled, { keyframes } from "styled-components";
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
export const CustomButton = styled.button`
  justify-content: center;
  align-items: center;
  border-radius: .5rem;
  border: 0px solid black;
  padding: 12px 16px;
  cursor: pointer;
  color: white;
  width: 100%;
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
  margin: 5px 0px;
}

`;

export const CustomLink = styled(Link)`
    text-decoration: none;
    color: white;
    width: 100%;
`;

export const ButtonContainer = styled.div`
    display: flex;
    width: 80%;
    @media (max-width: 480px) {
        width: 100%;
    }

    @media (min-width: 480px) {
        width: 70%;
    }

    @media (min-width: 768px) {
        width: 55%;
    }

    @media (min-width: 1025px) {
        width: 40%;
    }
`;
