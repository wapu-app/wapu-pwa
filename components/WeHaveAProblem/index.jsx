import Link from "next/link";
import { LinkWhite, CustomContainer, CustomTitle, CustomText } from "./styled";

export const WeHaveAProblem = ({ message }) => {
    return (
        <>
            <CustomContainer>
                <CustomTitle>Ups! We have a problem </CustomTitle>
                <CustomText>{message}</CustomText>
                <Link href="/oldHome">
                    <LinkWhite>Go back home</LinkWhite>
                </Link>
            </CustomContainer>
        </>
    );
};
