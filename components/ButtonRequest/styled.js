import Link from "next/link";
import styled, { keyframes, css } from "styled-components";

// Definición de la animación "bob" el boton sube y baja
const bobEffectContinuous = keyframes`
  0%, 100% {
    transform: translateY(0);
  } 
  50% {
    transform: translateY(-10px);
  }
`;
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
export const CustomButtonRequest = styled.button`
    display: flex;
    justify-content: center;
    border-radius: 8px;
    border: 0px solid black;
    padding: 12px 16px;
    cursor: pointer;
    color: white;
    width: 100%;
    margin: 5px 0px;
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
    //background-color: ${(props) => (props.pressed ? "#525252" : "#323232")};

    // Usamos la animación "bob" condicionalmente basada en la propiedad "pressed"
    animation: ${(props) =>
        props.pressed
            ? css`
                  ${bobEffectContinuous} 1.5s infinite
              `
            : "none"};
`;

export const CustomLink = styled(Link)`
    text-decoration: none;
    color: white;
`;

export const ButtonContainer = styled.div`
    display: flex;
    width: 80%;
`;
const rotation = keyframes`{
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
} 
`;
export const CustomLoader = styled.div`
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: inline-block;
    border-top: 3px solid #fff;
    border-right: 3px solid transparent;
    box-sizing: border-box;
    animation: ${css`
            ${rotation}`} 1s linear infinite;
    margin-left: 0.5rem;
`;
export const CustomContainer = styled.div`
    display: flex;
    align-items: center;
`;
