import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "../../components/Button";
import { abortTransaction } from "../../utils/cancelPayment";
import html2canvas from "html2canvas";
import Icon from "@mdi/react";

import { mdiArrowUp, mdiArrowLeft, mdiArrowDown } from "@mdi/js";
import {
    ButtonContainer,
    CustomDetail,
    CustomDetailTexts,
    CustomTitle,
    CustomText,
    CustomPText,
    CustomPTextMin,
    ContainerInfo,
    CustomDetailContainer,
    CustomScreenContainer,
    ContainerIcon,
    Spinner,
} from "./styled";
import { getTransaction } from "../../api/api";

export default function TransactionDetailPage() {
    const [showAbortButton, setShowAbortButton] = useState(false);
    const [transactionStatus, setTransactionStatus] = useState("");
    const [movement, setMovement] = useState(null);
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const router = useRouter();
    const exportRef = useRef(null);
    const { id } = router.query;

    const fetchTransaction = async (id) => {
        try {
            const { data } = await getTransaction(id);
            setMovement(data);
            setTransactionStatus(data.status);
            if (!data) {
                setError(true);
                setErrorMessage("Transaction not found");
            }
        } catch (error) {
            console.log(error);
            setError(true);
            setErrorMessage("Failed to fetch transaction");
        }
    };

    useEffect(() => {
        if (typeof id !== "undefined") {
            fetchTransaction(id);
        }
    }, [id]);

    const handleCaptureScreen = async () => {
        try {
            if (exportRef.current) {
                const canvas = await html2canvas(exportRef.current);
                const link = document.createElement("a");
                link.href = canvas.toDataURL("image/png");
                link.download = "screenshot.png";
                link.click();
            } else {
                console.error("Reference is not available.");
            }
        } catch (error) {
            console.log("error screenshot", error);
        }
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <>
            {movement ? (
                <CustomDetail>
                    <CustomScreenContainer ref={exportRef}>
                        <CustomDetailContainer>
                            <CustomPText>
                                <Icon
                                    path={
                                        movement.is_positive
                                            ? mdiArrowDown
                                            : mdiArrowUp
                                    }
                                    size={1}
                                />
                            </CustomPText>
                            <CustomTitle>
                                {movement.payment_amount}{" "}
                                {movement.payment_currency}
                            </CustomTitle>
                            <CustomText>{movement.type_name}</CustomText>
                        </CustomDetailContainer>
                        <CustomDetailTexts>
                            <CustomDetailContainer>
                                <ContainerInfo>
                                    <CustomText>Status:</CustomText>
                                    <CustomText> {movement.status}</CustomText>
                                </ContainerInfo>
                                {movement.receiver_name !== null ? (
                                    <ContainerInfo>
                                        <CustomText>Receiver: </CustomText>
                                        <CustomText>
                                            {movement.receiver_name}
                                        </CustomText>
                                    </ContainerInfo>
                                ) : (
                                    ""
                                )}
                                {movement.sender_username !== null ? (
                                    <ContainerInfo>
                                        <CustomText>Sender: </CustomText>
                                        <CustomText>
                                            {movement.sender_username}
                                        </CustomText>
                                    </ContainerInfo>
                                ) : (
                                    ""
                                )}
                                {movement.type === "fiat_transfer" ||
                                movement.type === "fast_fiat_transfer" ? (
                                    <ContainerInfo>
                                        <CustomText>Alias: </CustomText>
                                        <CustomText>
                                            {movement.alias}
                                        </CustomText>
                                    </ContainerInfo>
                                ) : (
                                    ""
                                )}
                                <ContainerInfo>
                                    <CustomText>Date:</CustomText>
                                    <CustomText>
                                        {movement.created_at}
                                    </CustomText>
                                </ContainerInfo>
                                <ContainerInfo>
                                    <CustomPTextMin>
                                        TransactionID:
                                    </CustomPTextMin>
                                    <CustomPTextMin>
                                        {movement.transaction_id}
                                    </CustomPTextMin>
                                </ContainerInfo>
                                <ContainerInfo>
                                    <CustomPTextMin>Total fee:</CustomPTextMin>
                                    <CustomPTextMin>
                                        {movement.fee_taken}
                                    </CustomPTextMin>
                                </ContainerInfo>
                                <ContainerInfo>
                                    <CustomPTextMin>
                                        Total amount:
                                    </CustomPTextMin>
                                    <CustomPTextMin>
                                        {movement.is_positive ? "+" : "-"}
                                        {movement.total_amount_taken}{" "}
                                        {movement.currency_taken}
                                    </CustomPTextMin>
                                </ContainerInfo>
                            </CustomDetailContainer>
                        </CustomDetailTexts>
                    </CustomScreenContainer>
                    <ButtonContainer>
                        {(movement.type === "qr_payment" ||
                            movement.type === "fast_fiat_transfer" ||
                            movement.type === "fiat_transfer") && (
                            <Button
                                text={"Bank receipt"}
                                isDisabled={!movement.receipt_image_url}
                                href={movement.receipt_image_url}
                                target="_blank"
                            />
                        )}
                        <Button
                            text={"Share receipt"}
                            onClick={handleCaptureScreen}
                        />
                        {transactionStatus.toLowerCase() === "pending" &&
                        movement.type.toLowerCase() !== "deposit" &&
                        movement.type.toLowerCase() !== "pix_deposit" &&
                        movement.type.toLowerCase() !== "withdraw" ? (
                            <Button
                                secondary={true}
                                onClick={() => {
                                    abortTransaction(
                                        id,
                                        setTransactionStatus,
                                        setShowAbortButton
                                    );
                                    getTransactions(id);
                                }}
                                text="Cancel"
                            />
                        ) : (
                            ""
                        )}
                    </ButtonContainer>
                </CustomDetail>
            ) : (
                <>
                    <Spinner />
                </>
            )}
            {error ? (
                <>
                    <CustomPText>{errorMessage}</CustomPText>
                    <Button
                        text={"Home"}
                        onClick={() => router.push("/oldHome")}
                    />
                </>
            ) : (
                ""
            )}
        </>
    );
}
