// Pure client-side helpers mirroring the backend quote in
// app_backend/.../direct_fiat_payment_service.py::calculate_quote (everything
// denominated through USDT; BTC/Lightning total converts to sats via ceil).
// Reference: 25000 ARS -> funding 16.68 USDT, fee 0.83, total 17.51, 27433 sats.
//
// NOTE: feeFraction is the user's real discounted rate (get_fee_with_discount,
// users_api.py), same as the backend. Only expected divergence: round2() here
// is half-up vs Python's half-to-even round(x,2), so a figure can differ by
// <=0.01 USDT — acceptable for an estimate; the tentative created at
// transaction time is authoritative.

const FIAT_TO_PAIR = {
    ARS: "USDT/ARS",
    BRL: "USDT/BRL",
};

// Which fiat currencies each funding crypto can settle against.
const CRYPTO_TO_FIATS = {
    USDT: ["ARS", "BRL"],
    BTC: ["ARS"],
};

const BTC_USD_PAIR = "BTC/USD";
const SATS_PER_BTC = 100_000_000;

const round2 = (n) => Math.round(n * 100) / 100;

// Finds a rate object ({ pair, buy, sell }) by pair. `rates` may be undefined
// while getUser() is still resolving, hence the array guard — returns null so
// callers render an empty state instead of crashing.
export const findRate = (rates, pair) => {
    if (!Array.isArray(rates)) {
        return null;
    }
    return rates.find((rate) => rate.pair === pair) || null;
};

export const getFiatOptionsForCrypto = (cryptoCurrency) => {
    return CRYPTO_TO_FIATS[cryptoCurrency] || [];
};

// Resolves and validates every rate/fee needed for a quote. Returns null when
// anything required is missing or non-positive (so the UI shows "---").
const resolveInputs = ({ rates, cryptoCurrency, fiatCurrency, feeFraction }) => {
    const pairRate = findRate(rates, FIAT_TO_PAIR[fiatCurrency]);
    const exchangeRate =
        pairRate && typeof pairRate.buy === "number" ? pairRate.buy : null;
    const validFee =
        typeof feeFraction === "number" && Number.isFinite(feeFraction);

    let btcUsdRate = null;
    if (cryptoCurrency === "BTC") {
        const btc = findRate(rates, BTC_USD_PAIR);
        btcUsdRate =
            btc && typeof btc.buy === "number" && btc.buy > 0 ? btc.buy : null;
        if (btcUsdRate === null) {
            return null;
        }
    }

    if (!(exchangeRate > 0) || !validFee) {
        return null;
    }
    return { exchangeRate, feeFraction, btcUsdRate };
};

// Given the pre-fee funding amount in USDT, derive the full breakdown. This is
// the single source of truth both directions funnel into.
const buildQuote = ({
    fundingUsdt,
    exchangeRate,
    feeFraction,
    cryptoCurrency,
    btcUsdRate,
}) => {
    const feeUsdt = round2(fundingUsdt * feeFraction);
    const totalUsdt = round2(fundingUsdt + feeUsdt);
    const fiatAmount = round2(fundingUsdt * exchangeRate);

    const quote = {
        cryptoCurrency,
        exchangeRate,
        fundingUsdt,
        feeUsdt,
        totalUsdt,
        fiatAmount,
    };

    if (cryptoCurrency === "BTC") {
        quote.btcUsdRate = btcUsdRate;
        // Deposit is shown pre-fee (funding); Total required uses the total.
        quote.fundingSat = Math.ceil((fundingUsdt / btcUsdRate) * SATS_PER_BTC);
        // totalSat matches the backend's funding_amount_sat (derived from total).
        quote.totalSat = Math.ceil((totalUsdt / btcUsdRate) * SATS_PER_BTC);
    }

    return quote;
};

// Forward: the user typed the fiat amount to cover.
//   funding = round(fiat / rate, 2)
export const estimateFromFiat = ({
    fiatAmount,
    rates,
    cryptoCurrency,
    fiatCurrency,
    feeFraction,
}) => {
    const inputs = resolveInputs({
        rates,
        cryptoCurrency,
        fiatCurrency,
        feeFraction,
    });
    const amount = parseFloat(fiatAmount);
    if (!inputs || !(Number.isFinite(amount) && amount > 0)) {
        return null;
    }

    const fundingUsdt = round2(amount / inputs.exchangeRate);
    if (!(fundingUsdt > 0)) {
        return null;
    }
    return buildQuote({ fundingUsdt, cryptoCurrency, ...inputs });
};

// Reverse: the user typed the crypto amount to deposit (the pre-fee funding).
//   USDT -> the input IS fundingUsdt.
//   BTC  -> the input is in sats; fundingUsdt = (sats / 1e8) * btcUsd.
export const estimateFromDeposit = ({
    depositAmount,
    rates,
    cryptoCurrency,
    fiatCurrency,
    feeFraction,
}) => {
    const inputs = resolveInputs({
        rates,
        cryptoCurrency,
        fiatCurrency,
        feeFraction,
    });
    const amount = parseFloat(depositAmount);
    if (!inputs || !(Number.isFinite(amount) && amount > 0)) {
        return null;
    }

    const fundingUsdt =
        cryptoCurrency === "BTC"
            ? round2((amount / SATS_PER_BTC) * inputs.btcUsdRate)
            : round2(amount);
    if (!(fundingUsdt > 0)) {
        return null;
    }
    return buildQuote({ fundingUsdt, cryptoCurrency, ...inputs });
};

// Trims trailing zeros for display inside an editable field: 16.68, 25000, 27433.
export const formatAmount = (n) => {
    if (!Number.isFinite(n)) {
        return "";
    }
    return String(parseFloat(n.toFixed(2)));
};

export const formatUsdt = (n) => (Number.isFinite(n) ? n.toFixed(2) : "");

export const formatSats = (n) =>
    Number.isFinite(n) ? Math.round(n).toLocaleString("en-US") : "";

export const satsToBtc = (sats) =>
    Number.isFinite(sats) ? (sats / SATS_PER_BTC).toFixed(8) : "";
