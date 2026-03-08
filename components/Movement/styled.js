import styled from "styled-components";
import Link from "next/link";
export const CustomContainer = styled.div`
    width: 100%;
    min-height: 70px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #fafafa;
`;
export const CustomInfoMovement = styled.div`
    width: 65%;
    height: 100%;
    display: flex;
    justify-content: start;
    align-items: center;
`;

export const CustomAmountMovement = styled.div`
    width: 35%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;
export const CustomPText = styled.p`
    font-size: 0.9rem;
    margin: 0;
`;
export const CustomPTextMin = styled.p`
    font-size: 0.7rem;
    margin: 0;
`;
export const CustomTexts = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: start;
`;

export const CustomImg = styled.div`
    height: 50px;
    width: 50px;
    border-radius: 50%;
`;
export const CustomLink = styled(Link)`
    text-decoration: none;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
`;
