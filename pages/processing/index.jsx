"use client";
import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "../../components/Button";
import {
    abortTransaction,
    updateTransactionToPending,
} from "../../utils/cancelPayment";
import ModalWithButton from "../../components/ModalWithButton";
import useTransactionStatus from "../../utils/useTransactionStatus";
import ProcessBar from "../../components/ProcessBar";
import {
    ButtonContainer,
    Container,
    TextContainer,
    PText,
    CustomTitle,
    Spinner,
} from "./styled";

export default function ProcessingPage() {
    const router = useRouter();
    const { trx_id } = router.query;
    const [showAbortButton, setShowAbortButton] = useState(false);
    const [transactionStatus, setTransactionStatus] = useState("");
    const [askCashier, setAskCashier] = useState(false);
    const [areYouSure, setAreYouSure] = useState(false);

    useTransactionStatus(
        trx_id,
        transactionStatus,
        setTransactionStatus,
        setShowAbortButton,
        setAskCashier
    );

    const userPendingActionContent = {
        message: "Notify the cashier that you will pay with QR.",
        secondaryButton: "Cancel",
        primaryButton: "Continue",
        secondaryButtonOnClick: () => {
            setAreYouSure(true);
        },
        primaryButtonOnClick: () => {
            updateTransactionToPending(
                trx_id,
                setTransactionStatus,
                setAskCashier
            );
        },
        secondaryButtonState: true /* to show or not a second button */,
    };

    const areYouSureContent = {
        message: "Are you sure? The transaction will be canceled.",
        secondaryButton: "Cancel",
        primaryButton: "Yes",
        secondaryButtonOnClick: () => {
            setAreYouSure(false);
        },
        primaryButtonOnClick: async () => {
            await abortTransaction(trx_id, setTransactionStatus, setAskCashier);
            setAreYouSure(false);
            setAskCashier(false);
        },
        secondaryButtonState: true /* to show or not a second button */,
    };

    const handleCancel = () => {
        abortTransaction(trx_id, setTransactionStatus, setShowAbortButton);
    };

    return (
        <>
            <ModalWithButton
                state={askCashier}
                errorModalOnRequestClose={() => {}}
                content={userPendingActionContent}
            />
            <ModalWithButton
                state={areYouSure}
                errorModalOnRequestClose={() => {}}
                content={areYouSureContent}
            />
            <Container>
                <ProcessBar status={transactionStatus} />
                <TextContainer>
                    <CustomTitle>
                        Payment status: {transactionStatus}
                    </CustomTitle>
                    {(transactionStatus.toLowerCase() === "pending" ||
                        transactionStatus.toLowerCase() === "processing") && (
                        <TextContainer>
                            <Spinner />
                            <PText>We are processing the payment.</PText>
                            <PText>It will take a few seconds, hold on.</PText>
                        </TextContainer>
                    )}
                </TextContainer>

                <ButtonContainer>
                    {showAbortButton ? (
                        <Button
                            secondary={true}
                            onClick={handleCancel}
                            text="Cancel"
                        />
                    ) : (
                        ""
                    )}
                    {transactionStatus.toLowerCase() === "canceled" ? (
                        <Button href={"/oldHome"} text="Home" />
                    ) : (
                        ""
                    )}
                </ButtonContainer>
            </Container>
        </>
    );
}
