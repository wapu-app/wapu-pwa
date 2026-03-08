import { updateTransactionStatus } from "../api/api";

export const updateTransactionToPending = async (
    trx_id,
    setTransactionStatus,
    setAskCashier
) => {
    try {
        const { data } = await updateTransactionStatus("PENDING", trx_id);
        setTransactionStatus(data.status);
        setAskCashier(false);
    } catch (error) {
        console.error("Failed to update transaction status to pending:", error);
    }
};

export const abortTransaction = async (
    trx_id,
    setTransactionStatus,
    setShowAbortButton
) => {
    try {
        const { data } = await updateTransactionStatus("CANCELED", trx_id);
        setTransactionStatus(data.status);
        setShowAbortButton(false);
    } catch (error) {
        console.error("Failed to abort transaction:", error);
    }
};

export const cancelTransaction = async (
    trx_id,
) => {
    try {
        await updateTransactionStatus("CANCELED", trx_id);
    } catch (error) {
        console.error("Failed to abort transaction:", error);
    }
};
