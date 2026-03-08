import { Button } from "../../components/Button";
import {
    CustomContainer,
    CustomText,
    CustomTitle,
    CenterContainer,
} from "./styled";
import { useRouter } from "next/navigation";

export default function TransactionCompletePage() {
    const router = useRouter();
    const backHome = () => {
        router.push("/oldHome");
    };
    return (
        <CustomContainer>
            <CustomTitle>KYC Process Completed</CustomTitle>
            <CenterContainer>
                <CustomText>Thanks!</CustomText>
                <CustomText>
                    We're going to review your data and let you know.
                </CustomText>
                <Button text="Home" onClick={backHome} />
            </CenterContainer>
        </CustomContainer>
    );
}
