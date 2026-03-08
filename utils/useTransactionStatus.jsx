import { useEffect } from "react";
import { useRouter } from "next/router";
import { getTransaction } from "../api/api";

const useTransactionStatus = (
    trx_id,
    transactionStatus,
    setTransactionStatus,
    setShowAbortButton,
    setAskCashier
) => {
    const INTERVAL = 2000;
    const router = useRouter();

    useEffect(() => {
        const intervalId = setInterval(async () => {
            if (
                trx_id &&
                typeof transactionStatus === "string" &&
                transactionStatus.toLowerCase() !== "user pending action"
            ) {
                const transaction = await getTransaction(trx_id);
                setTransactionStatus(transaction.data.status);
                if (transaction.data.status === "Pending") {
                    setShowAbortButton(true);
                } else {
                    setShowAbortButton(false);
                }
                if (
                    transaction.data.status === "Paid" ||
                    transaction.data.status === "Completed"
                ) {
                    clearInterval(intervalId);
                    router.push(`/newTransactionComplete?id=${trx_id}`);
                } else if (transaction.data.status === "User Pending Action") {
                    setAskCashier(true);
                } else if (transaction.data.status === "Canceled") {
                    clearInterval(intervalId);
                }
            }
        }, INTERVAL);

        return () => {
            clearInterval(intervalId);
        };
    }, [
        trx_id,
        transactionStatus,
        setTransactionStatus,
        setShowAbortButton,
        setAskCashier,
        router,
    ]);

    return null;
};

export default useTransactionStatus;
