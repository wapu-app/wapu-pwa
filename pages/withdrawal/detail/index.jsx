import React, { useEffect } from "react";
import { Button } from "../../../components/Button";
import { useRouter } from "next/router";
import {
    MainContainer,
    ContainerInfo,
    Check,
    Texts,
    Text,
    TextMin,
    CustomTitle,
} from "./styled";
export default function index() {
    const router = useRouter();
    const { currency, amount } = router.query;

    return (
        <MainContainer>
            <CustomTitle>Withdrawal</CustomTitle>
            <ContainerInfo>
                <Check>✔️</Check>
                <Texts>
                    <Text>Processing withdrawal!</Text>
                    <Text>
                        {amount} {currency} will be send
                    </Text>
                </Texts>
                <TextMin>It could take up to 4hs to be processed</TextMin>
            </ContainerInfo>
            <Button
                text={"Finish"}
                onClick={() => {
                    window.location.replace("/oldHome");
                }}
            />
        </MainContainer>
    );
}
