// `is_positive` is tri-state: true (credit), false (debit) and null for a
// ledger-neutral record such as `deposit_ars` (the ARS paid for a swap: it
// never touches the balance). Null must read neutral: no sign, no debit or
// credit color. `undefined` keeps the historical debit reading.
export const isNeutralTransaction = (transaction) =>
    Boolean(transaction) && transaction.is_positive === null;

export function amountSign(transaction) {
    if (isNeutralTransaction(transaction)) {
        return "";
    }
    return transaction && transaction.is_positive ? "+" : "-";
}
