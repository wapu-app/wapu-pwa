// `is_positive` is tri-state: true (credit), false (debit), null for a ledger-neutral
// record such as `deposit_ars` (reads neutral: no sign, no color). `undefined`
// keeps the historical debit reading.
export const isNeutralTransaction = (transaction) =>
    Boolean(transaction) && transaction.is_positive === null;

export function amountSign(transaction) {
    if (isNeutralTransaction(transaction)) {
        return "";
    }
    return transaction && transaction.is_positive ? "+" : "-";
}
