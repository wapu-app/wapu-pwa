import { describe, expect, it } from "vitest";
import {
    estimateFromFiat,
    maxFiatFromBalance,
} from "../../../utils/exchangeCalculator";

const rates = [
    { pair: "USDT/ARS", buy: 1_556.3, sell: 1_626.26 },
    { pair: "USDT/BRL", buy: 5.12, sell: 5.23 },
    { pair: "BTC/USD", buy: 79_927.99, sell: 84_621.58 },
];

const maxArs = (balanceUsdt: number, feeFraction: number) =>
    maxFiatFromBalance({
        balanceUsdt,
        rates,
        fiatCurrency: "ARS",
        feeFraction,
    });

const quoteFor = (fiatAmount: number, feeFraction: number) =>
    estimateFromFiat({
        fiatAmount: String(fiatAmount),
        rates,
        cryptoCurrency: "USDT",
        fiatCurrency: "ARS",
        feeFraction,
    });

describe("maxFiatFromBalance", () => {
    // The whole point of the helper: whatever it returns has to be spendable.
    it.each([
        [1_282.4, 0.004],
        [1_282.4, 0.008],
        [100, 0.02],
        [100, 0.04],
        [7.77, 0.07],
        [0.5, 0],
        [12_345.67, 0.035],
    ])(
        "never quotes above a balance of %s USDT at a %s fee",
        (balanceUsdt, feeFraction) => {
            const fiatAmount = maxArs(balanceUsdt, feeFraction);
            expect(fiatAmount).not.toBeNull();

            const quote = quoteFor(fiatAmount as number, feeFraction);
            expect(quote).not.toBeNull();
            expect(quote!.totalUsdt).toBeLessThanOrEqual(balanceUsdt);
        }
    );

    // A cent of funding is ~15 ARS at this rate, so the leftover has to stay
    // well under a dollar — the old formula left 1 USDT or more behind.
    it.each([
        [1_282.4, 0.004],
        [100, 0.04],
        [12_345.67, 0.035],
    ])(
        "leaves less than a cent of funding unspent for %s USDT at %s",
        (balanceUsdt, feeFraction) => {
            const fiatAmount = maxArs(balanceUsdt, feeFraction) as number;
            const quote = quoteFor(fiatAmount, feeFraction)!;
            const leftover = balanceUsdt - quote.totalUsdt;

            expect(leftover).toBeGreaterThanOrEqual(0);
            expect(leftover).toBeLessThan(0.01 * (1 + feeFraction) + 0.01);
        }
    );

    it("beats the old balance * (1 - fee) formula it replaces", () => {
        const balanceUsdt = 100;
        const feeFraction = 0.04;

        const previous = Math.floor(
            (balanceUsdt - balanceUsdt * 0.01) * (1 - feeFraction) * 1_556.3
        );
        const current = maxArs(balanceUsdt, feeFraction) as number;

        expect(current).toBeGreaterThan(previous);
        expect(quoteFor(current, feeFraction)!.totalUsdt).toBeLessThanOrEqual(
            balanceUsdt
        );
    });

    it("returns null when the inputs cannot produce a quote", () => {
        expect(maxArs(0, 0.02)).toBeNull();
        expect(maxArs(-1, 0.02)).toBeNull();
        expect(
            maxFiatFromBalance({
                balanceUsdt: 100,
                rates: [],
                fiatCurrency: "ARS",
                feeFraction: 0.02,
            })
        ).toBeNull();
        expect(
            maxFiatFromBalance({
                balanceUsdt: 100,
                rates,
                fiatCurrency: "ARS",
                feeFraction: undefined,
            })
        ).toBeNull();
        expect(
            maxFiatFromBalance({
                balanceUsdt: null,
                rates,
                fiatCurrency: "ARS",
                feeFraction: 0.02,
            })
        ).toBeNull();
    });

    it("scales with the fee: a cheaper transfer can send more", () => {
        const cheap = maxArs(1_282.4, 0.004) as number;
        const pricey = maxArs(1_282.4, 0.008) as number;

        expect(cheap).toBeGreaterThan(pricey);
    });
});
