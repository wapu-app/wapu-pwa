import { describe, expect, it } from "vitest";

import { amountSign, isNeutralTransaction } from "../../../utils/transactionSign";

describe("transaction sign", () => {
    it("reads is_positive as credit, debit or ledger-neutral", () => {
        expect(amountSign({ is_positive: true })).toBe("+");
        expect(amountSign({ is_positive: false })).toBe("-");
        expect(amountSign({ is_positive: null })).toBe("");
        expect(isNeutralTransaction({ is_positive: null })).toBe(true);
        expect(isNeutralTransaction({ is_positive: false })).toBe(false);
    });
});
