import { describe, expect, it } from "vitest";

const nextConfig = require("../../next.config");

describe("legacy route redirects", () => {
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
