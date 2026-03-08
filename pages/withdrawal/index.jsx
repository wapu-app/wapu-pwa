import { useState, useEffect } from "react";
import CONFIG from "../../config/environment/current";
import { CustomInput } from "../../components/Input";
import { CustomInputReadOnly } from "../../components/InputReadOnly";
import { ButtonRequest } from "../../components/ButtonRequest";
import { CustomSelect } from "../../components/Select";
import ErrorModal from "../../components/ErrorModal";
import {
    Container,
    FormContainer,
    IndividualInputContainer,
    Form,
    InputsContainer,
    PText,
    CustomTitle,
} from "./styled";
import { getAccessToken } from "../../utils/auth";
import { isValidAmount } from "../../utils/validations";
import { useUserContext } from "../../context/userContext";
import { useRouter } from "next/router";

export default function WithdrawalPage() {
    const { getUser, user, setIsOpen } = useUserContext();
    const [errorModalState, setErrorModalState] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [address, setAddress] = useState("");
    const [network, setNetwork] = useState("");
    const [minimumUSDT, setMinimumUSDT] = useState("");
    const [minimumWithdrawalMessage, setMinimumWithdrawalMessage] =
        useState("");
    const [networkFeeMessage, setNetworkFeeMessage] = useState("");
    const [currency, setCurrency] = useState("USDT");
    const [amount, setAmount] = useState("");
    const [receiveAmount, setReceiveAmount] = useState("");
    const [blockchainsOptions, setBlockchainsOptions] = useState([]);

    const getBlockchainsOptions = () => {
        if (user && user.blockchains) {
            const blockchainsOptions = user.blockchains.map((blockchain) => ({
                id: blockchain.network,
                name: blockchain.network_name,
            }));
            setBlockchainsOptions(blockchainsOptions);
        }
    };
    const handleAddressChange = (e) => {
        setAddress(e.target.value);
    };
    const handleNetworkChange = (e) => {
        const selectedNetwork = e.target.value;
        const selectedIndex = e.target.options.selectedIndex - 1;
        const selectedWithdrawFee =
            user.blockchains[selectedIndex].withdraw_fee;

        setNetwork(selectedNetwork);
        setNetworkFeeMessage(selectedWithdrawFee);
        setMinimumWithdrawalMessage(
            parseFloat(minimumUSDT) + parseFloat(selectedWithdrawFee)
        );
        setAmount("");
        setReceiveAmount("");
    };
    const handleCurrencyChange = (e) => {
        setCurrency(e.target.value);
    };
    const handleAmountChange = (e) => {
        const amountValue = e.target.value;
        if (isValidAmount(amountValue)) {
            setAmount(amountValue);
            if (
                amountValue === "" ||
                networkFeeMessage === "" ||
                parseFloat(amountValue) < parseFloat(networkFeeMessage)
            ) {
                setReceiveAmount("");
            } else {
                setReceiveAmount(
                    parseFloat(amountValue) - parseFloat(networkFeeMessage)
                );
            }
        }
    };
    const maxAmount = () => {
        if (networkFeeMessage === "") {
            setErrorMessage(
                "Please, select a network to calculate available max amount."
            );
            setErrorModalState(true);
            return;
        }
        const maxAmount = user.usdtBalance;
        setAmount(maxAmount);
        setReceiveAmount(parseFloat(maxAmount) - parseFloat(networkFeeMessage));
    };
    const router = useRouter();

    const handleWithdrawal = async (e) => {
        e.preventDefault();
        try {
            const withdrawalData = {
                address: address,
                network: network,
                currency: currency,
                amount: amount,
            };
            const accessToken = await getAccessToken();
            const res = await fetch(CONFIG.API.BASE_URL + "/wallet/withdraw", {
                method: "POST",
                body: JSON.stringify(withdrawalData),
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    Authorization: "Bearer " + accessToken,
                },
            });

            const data = await res.json();
            if (res.status === 201) {
                router.push({
                    pathname: "/withdrawal/detail",
                    query: withdrawalData,
                });
            } else {
                setErrorMessage(data.error);
                setErrorModalState(true);
            }
        } catch (error) {
            setErrorMessage(
                "There has been an error. Please, try again in a few minutes."
            );
            setErrorModalState(true);
        }
    };

    useEffect(() => {
        getUser();
    }, []);
    useEffect(() => {
        getBlockchainsOptions();
        setMinimumUSDT(user.minimumWithdrawalAmountUsdt);
    }, [user]);

    return (
        <Container>
            <ErrorModal
                message={errorMessage}
                state={errorModalState}
                errorModalOnRequestClose={() => setErrorModalState(false)}
            />
            <CustomTitle>Withdrawal</CustomTitle>
            <FormContainer>
                <Form onSubmit={handleWithdrawal}>
                    <InputsContainer>
                        <IndividualInputContainer>
                            <label>Currency</label>
                            <CustomInputReadOnly
                                type="text"
                                value={currency}
                                onChange={handleCurrencyChange}
                                required
                                label={"Currency"}
                                readOnly
                            />
                        </IndividualInputContainer>
                        <IndividualInputContainer>
                            <label>Network</label>
                            <CustomSelect
                                label={"Select Network"}
                                name={"network"}
                                value={network}
                                onChange={handleNetworkChange}
                                options={blockchainsOptions}
                            />
                        </IndividualInputContainer>
                        <IndividualInputContainer>
                            <label>Address</label>
                            <CustomInput
                                type="text"
                                value={address}
                                onChange={handleAddressChange}
                                required
                                label={"Address"}
                            />
                        </IndividualInputContainer>
                        <IndividualInputContainer>
                            <label>Amount</label>
                            <CustomInput
                                label={"Amount"}
                                name={"amount"}
                                value={amount}
                                onChange={handleAmountChange}
                                required
                                autoComplete={"off"}
                                text={"MAX"}
                                onClick={maxAmount}
                            />
                        </IndividualInputContainer>
                    </InputsContainer>
                    <PText>
                        Network fee: {networkFeeMessage} {currency}
                    </PText>
                    <PText>
                        Minimum withdrawal:{" "}
                        {minimumWithdrawalMessage !== ""
                            ? minimumWithdrawalMessage
                            : minimumUSDT}{" "}
                        {currency}
                    </PText>
                    {receiveAmount !== "" ? (
                        <PText>
                            Receive amount: {receiveAmount.toFixed(2)}{" "}
                            {currency}
                        </PText>
                    ) : (
                        <></>
                    )}
                </Form>
            </FormContainer>
            <ButtonRequest
                type="submit"
                text={"Send"}
                onClick={handleWithdrawal}
            ></ButtonRequest>
        </Container>
    );
}
