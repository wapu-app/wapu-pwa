import { useState, useEffect } from "react";
import { YStack, H6, Paragraph, XStack } from "tamagui";
import { useRouter } from "next/router";
import QRCode from "qrcode.react";
import Image from "next/image";

import ErrorModal from "../../components/ErrorModal";
import TamaguiButton from "../../components/TamaguiButton";
import TamaguiInput from "../../components/TamaguiInput";
import { TamaguiSelect } from "../../components/TamaguiSelect";
import NewHeaderButton from "../../components/newHeaderButton";

import WarningIcon from "../../public/warning_icon.svg";
import CopyIcon from "../../public/copy_icon.svg";

import { postDeposit } from "../../api/api";

import { useUserContext } from "../../context/userContext";

export default function NewBlockchainDeposit() {
    const router = useRouter();
    const { getUser, user } = useUserContext();

    const [step, setStep] = useState(1);
    const [blockchainsOptions, setBlockchainsOptions] = useState([]);
    const [blockchain, setBlockchain] = useState({});
    const [networkName, setNetworkName] = useState("");
    const [currency, setCurrency] = useState("");
    const [amount, setAmount] = useState("");
    const [address, setAddress] = useState("");
    const [minDepositAmount, setMinDepositAmount] = useState("");
    const [transactionId, setTransactionId] = useState(null);
    const [amountError, setAmountError] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");
    const [errorModalState, setErrorModalState] = useState(false);

    const currencyOptions = [
        { name: "USDT", id: "USDT" },
        { name: "USDC", id: "USDC" },
    ];

    const handleAmountChange = (value) => {
        setAmountError(false);
        const usdValuePattern = /^\d+(\.\d+)?$/;
        setAmount(value);
        const minAmount = parseFloat(minDepositAmount);
        const enteredAmount = parseFloat(value);
        if (
            !usdValuePattern.test(value) ||
            (minAmount && enteredAmount < minAmount)
        ) {
            setAmountError(true);
        }
    };

    const handleNetworkChange = (index) => {
        const selectedBlockchain = blockchainsOptions.at(index);
        setBlockchain(selectedBlockchain);
        setAddress(selectedBlockchain.address);
        setNetworkName(selectedBlockchain.name);
    };

    const handleCurrencyChange = (index) => {
        const selectedCurrency = currencyOptions.at(index).name;
        setCurrency(selectedCurrency);
    };

    const handleIconPressed = () => {
        navigator.clipboard.writeText(address);
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
            setCurrency("");
            setBlockchain({});
            setAddress("");
            setAmount("");
        } else {
            router.back();
        }
    };

    const handleContinue = async (e) => {
        if (step === 1) {
            const payload = {
                amount: amount,
                currency: currency,
                network: blockchain.network,
            };

            try {
                const { data, status } = await postDeposit(payload);

                if (status === 200 || status === 201) {
                    setTransactionId(data.transaction_id);
                    setStep(2);
                } else if (status >= 400 && status <= 500) {
                    setErrorMessage(data.error);
                    setErrorModalState(true);
                } else {
                    setErrorMessage(
                        "An unexpected error occurred. Please try again later."
                    );
                    setErrorModalState(true);
                }
            } catch (error) {
                console.error("error with deposit: ", e);
            }
        } else {
            router.push(
                "/newTransactionComplete?id=" +
                    transactionId +
                    "&transaction_type=deposit"
            );
        }
    };
    // check if we can replace with get settings
    // since currently blockchain options are all separated in settings
    const getBlockchainsOptions = () => {
        if (user && user.blockchains) {
            const blockchainsOptions = user.blockchains.map((blockchain) => ({
                id: blockchain.network,
                name: blockchain.network_name,
                network: blockchain.network,
                address: blockchain.address,
            }));
            setBlockchainsOptions(blockchainsOptions);
            setMinDepositAmount(user.minDepositUsdt);
        }
    };

    useEffect(() => {
        getUser();
    }, []);

    useEffect(() => {
        getBlockchainsOptions();
    }, [user]);

    return (
        <YStack
            width={"$width100"}
            height={"$height100"}
            alignItems="center"
            alignContent="center"
        >
            <ErrorModal
                message={errorMessage}
                state={errorModalState}
                errorModalOnRequestClose={() => setErrorModalState(false)}
            />
            <YStack padding={"$4"} width={"$width100"}>
                <NewHeaderButton onClick={handleBack}>
                    Deposit by {networkName || "Blockchain"}
                </NewHeaderButton>
            </YStack>

            {step === 1 ? (
                <YStack
                    height={"$height100"}
                    width={"$width90"}
                    gap={"$3.5"}
                    alignItems="left"
                    alignContent="center"
                >
                    <H6 color={"$neutral13"} textAlign="center">
                        Use it if you're sending coins from your exchange
                    </H6>
                    <Paragraph color={"$neutral12"} weight={"$2"} size={"$3"}>
                        Currency
                    </Paragraph>
                    <TamaguiSelect
                        value={currency}
                        onChange={handleCurrencyChange}
                        items={currencyOptions}
                        placeholder={"Select currency"}
                    />
                    <Paragraph color={"$neutral12"} weight={"$2"} size={"$3"}>
                        Network
                    </Paragraph>
                    <TamaguiSelect
                        value={networkName}
                        onChange={handleNetworkChange}
                        items={blockchainsOptions}
                        placeholder={"Select network"}
                    />
                    <Paragraph color={"$neutral12"} weight={"$2"} size={"$3"}>
                        Amount
                    </Paragraph>
                    <TamaguiInput
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="Enter Amount"
                        keyboardType="decimal-pad"
                        error={amountError}
                    />
                    <YStack
                        backgroundColor={"$neutral3"}
                        padding={"$4"}
                        borderRadius={"$8"}
                    >
                        <XStack
                            gap={"$2"}
                            justifyContent="flex-start"
                            alignItems="center"
                        >
                            <Image src={WarningIcon} alt="warning_icon" />
                            <Paragraph
                                color={"$neutral11"}
                                weight={"$1"}
                                size={"$4"}
                            >
                                You have to deposit minimum {minDepositAmount}{" "}
                                USDT/USDC.
                            </Paragraph>
                        </XStack>
                        <XStack
                            gap={"$2"}
                            justifyContent="flex-start"
                            alignItems="center"
                        >
                            <Image src={WarningIcon} alt="warning_icon" />
                            <Paragraph
                                color={"$neutral11"}
                                weight={"$1"}
                                size={"$4"}
                            >
                                Sender wallet may apply fees.
                            </Paragraph>
                        </XStack>
                    </YStack>
                    <TamaguiButton
                        text="Next"
                        onClick={handleContinue}
                        isDisabled={
                            !networkName || !currency || !amount || amountError
                        }
                    />
                </YStack>
            ) : (
                <YStack
                    height={"$height100"}
                    width={"$width90"}
                    gap={"$3.5"}
                    alignItems="center"
                    alignContent="center"
                >
                    <H6 color={"$neutral13"} textAlign="center">
                        Send the funds to this address
                    </H6>
                    <XStack
                        padding={"$5"}
                        backgroundColor={"$neutral13"}
                        borderRadius={"$6"}
                    >
                        <QRCode value={address} size={200} />
                    </XStack>
                    <Paragraph
                        color={"$neutral12"}
                        weight={"$1"}
                        size={"$3"}
                        textAlign="right"
                    >
                        Your Wapu Wallet address
                    </Paragraph>
                    <TamaguiInput
                        value={address}
                        editable={false}
                        color={"$neutral12"}
                        icon={CopyIcon}
                        onPressIcon={handleIconPressed}
                        textAlign="right"
                    />
                    <Paragraph color={"$neutral12"} weight={"$1"} size={"$4"}>
                        Send only {currency} one time to this address using the{" "}
                        {networkName} network to avoid losing funds.
                    </Paragraph>
                    <TamaguiButton text="Confirm" onClick={handleContinue} />
                </YStack>
            )}
        </YStack>
    );
}
