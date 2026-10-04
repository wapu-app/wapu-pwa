// Synthetic public API payloads. Purchase money is sats or USDT cents, not token units.
export const PURCHASE_QUOTE = {
    type: "crypto_purchase",
    direction: "ramp_on",
    payout_currency: "SAT",
    payout_network: "LIGHTNING",
    amount_ars_cents: 1500000,
    amount_out: 10000,
    amount_out_unit: "sats",
    network_fee_out: 26,
    total_amount_usdt: 1500,
    fee_amount_usdt: 15,
    funding_amount_usdt: 1485,
    min_amount_ars_cents: 1000000,
    expiration_minutes: 15,
    liquidity_ok: true,
};

export const PURCHASE = {
    ...PURCHASE_QUOTE,
    tentative_id: "99999999-8888-7777-6666-555555555555",
    status: "CREATED",
    payout_address: "buyer@example.invalid",
    expires_at: "2999-01-01T00:00:00Z",
    watch_pending: false,
};

export const FUNDED_PURCHASE = {
    ...PURCHASE,
    status: "FUNDING_ISSUED",
    amount_ars_cents: 1500037,
    alias: "test.receiver.alias",
    cvu: "0000000000000000000000",
    watch_pending: true,
};
