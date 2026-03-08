import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "../../components/Button";
import { abortTransaction } from "../../utils/cancelPayment";
import ErrorModal from "../../components/ErrorModal";
import { getTransaction } from "../../api/api";
import {
    SectionContainer,
    Title,
    SubTitle,
    Check,
    Cancel,
    Support,
    StyledLink,
    ButtonContainer,
    Spinner,
} from "./styled";

export default function TransactionCompletePage() {
    const [showAbortButton, setShowAbortButton] = useState(false);
    const [isCanceled, setIsCanceled] = useState(null);
    const [isFinished, setIsFinished] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorModalState, setErrorModalState] = useState(false);
    const [transactionStatus, setTransactionStatus] = useState("");
    const router = useRouter();
    const { message, trx_id } = router.query;

    const getAndSetTransactionData = async (id) => {
        try {
            const { data } = await getTransaction(id);

            if (data && data.status) {
                setTransactionStatus(data.status);
                setIsFinished(
                    data.status.toLowerCase() === "paid" ||
                        data.status.toLowerCase() === "completed"
                );
                setShowAbortButton(
                    !(
                        data.type.toLowerCase() === "deposit" ||
                        data.type.toLowerCase() === "pix_deposit" ||
                        data.type.toLowerCase() === "withdrawal"
                    )
                );
            } else {
                setErrorMessage("Invalid transaction data");
                setErrorModalState(true);
            }
        } catch (error) {
            setErrorMessage(error.message);
            setErrorModalState(true);
        }
    };

    useEffect(() => {
        if (typeof transactionStatus === "string") {
            setIsCanceled(transactionStatus.toLowerCase() === "canceled");
        }
    }, [transactionStatus]);

    useEffect(() => {
        if (typeof trx_id !== "undefined") {
            getAndSetTransactionData(trx_id);
        }
    }, [trx_id]);

    return (
        <>
            <ErrorModal
                message={errorMessage}
                state={errorModalState}
                errorModalOnRequestClose={() => setErrorModalState(false)}
            />
            <SectionContainer>
                {transactionStatus === "" ? (
                    <Spinner />
                ) : (
                    <>
                        {isCanceled ? (
                            <>
                                <Title>Transaction Canceled!</Title>
                                <Cancel />
                            </>
                        ) : (
                            <>
                                <Title>Done!</Title>
                                <>
                                    <SubTitle>{message}</SubTitle>
                                    <Check />
                                </>
                            </>
                        )}
                    </>
                )}
                <Support>
                    <StyledLink href="https://wa.me/5491124060850">
                        Need any help?
                    </StyledLink>
                </Support>
                <ButtonContainer>
                    <Button
                        href="/oldHome"
                        text="Back home"
                        isDisabled={transactionStatus === ""}
                    />
                    <Button
                        secondary={true}
                        href={`transactionDetail?id=${trx_id}`}
                        text="Details"
                        isDisabled={transactionStatus === ""}
                    />
                    {transactionStatus !== "" &&
                    showAbortButton &&
                    !isCanceled &&
                    !isFinished ? (
                        <Button
                            secondary={true}
                            onClick={() => {
                                abortTransaction(
                                    trx_id,
                                    setTransactionStatus,
                                    setShowAbortButton
                                );
                                getAndSetTransactionData(trx_id);
                            }}
                            text="Cancel"
                        />
                    ) : (
                        ""
                    )}
                </ButtonContainer>
            </SectionContainer>
        </>
    );
}
