import { describe, expect, it } from "vitest";

const nextConfig = require("../../next.config");

describe("legacy route redirects", () => {
    it("leaves the root route to the client session gate", async () => {
        const redirects = await nextConfig.redirects();
        const rewrites = await nextConfig.rewrites();

        expect(redirects).not.toEqual(
            expect.arrayContaining([expect.objectContaining({ source: "/" })]),
        );
        expect(rewrites).not.toEqual(
            expect.arrayContaining([expect.objectContaining({ source: "/" })]),
        );
    });

    it("permanently maps retired routes to their Tamagui replacements", async () => {
        const redirects = await nextConfig.redirects();
        const routes = Object.fromEntries(
            redirects.map(({ source, destination, permanent }) => [
                source,
                { destination, permanent },
            ])
        );

        expect(routes).toMatchObject({
            "/oldHome": { destination: "/home", permanent: true },
            "/deposit": { destination: "/newDepositChoice", permanent: true },
            "/send": { destination: "/newSend", permanent: true },
            "/movements": { destination: "/newMovements", permanent: true },
            "/withdrawal": { destination: "/newWithdrawal", permanent: true },
            "/transactionDetail": {
                destination: "/newTransactionDetail",
                permanent: true,
            },
            "/transactionComplete": {
                destination: "/newTransactionComplete",
                permanent: true,
            },
        });
    });
});
