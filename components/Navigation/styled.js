import Link from "next/link";
import styled from "styled-components";

export const NavigationContainer = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
    border-top: 1px solid #341931;
    box-shadow: rgba(255, 91, 236, 0.5);
    margin: 10px
`;

export const List = styled.div`
    display: none;
    justify-content: space-around;

    @media (max-width: 480px) {
        display: flex;
        margin-bottom: 20px;
        padding-top: 5%;
        width: 100%;
    }

`;

export const ListItem = styled.div``;

export const CustomLink = styled(Link)`
    font-size: 18px;
    font-family: ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono",
        "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro",
        "Fira Mono", "Droid Sans Mono", "Courier New", monospace;
    color: white;
    text-decoration: none;
    justify-content: center;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

export const IconWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 50px;
    background-color: white;
    border-radius: 15px;
    box-shadow: 2px 5px 20px 0px rgba(255, 91, 239, 0.5);
`;

export const DesktopContainer = styled.div`
    width: 100%;
    @media (min-width: 480px) {
        display: flex;
        width:100%;
        gap: 1rem;
        button {
            box-shadow: 2px 5px 20px 0px rgba(255, 91, 239, 0.5);
        }
    }
    @media (max-width: 480px) {
        display: none;
    }
`;
