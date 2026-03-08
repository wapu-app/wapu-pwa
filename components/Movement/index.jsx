import {
    CustomContainer,
    CustomInfoMovement,
    CustomAmountMovement,
    CustomPText,
    CustomPTextMin,
    CustomTexts,
    CustomImg,
    CustomLink,
} from "./styled";
export default function index(props) {
    const { userMovements, date } = props;
    const typeAmount = (transaction) => {
        let amount = 0;
        if (
            transaction.type === "withdraw"
        ) {
            amount = transaction.total_amount_taken;
        }
        if (
            transaction.type === "send_inner_transf" ||
            transaction.type === "payer_reward" ||
            transaction.type === "fee_earnings" ||
            transaction.type === "referral_reward" ||
            transaction.type === "deposit" ||
            transaction.type === "pix_deposit" ||
            transaction.type === "receive_inner_transf" ||
            transaction.type === "fiat_transfer" ||
            transaction.type === "qr_payment" ||
            transaction.type === "fast_fiat_transfer"
        ) {
            amount = transaction.payment_amount;
        }
        return amount.toFixed(2);
    };
    return (
        <>
            {userMovements.map((transaction, index) => (
                <CustomContainer className="Movement" key={index}>
                    <CustomLink
                        href={`transactionDetail?id=${transaction.transaction_id}`}
                    >
                        <CustomInfoMovement className="infoMovement">
                            <CustomImg className="img">
                                <img src="" alt="" />
                            </CustomImg>
                            <CustomTexts className="texts">
                                <CustomPText>
                                    {transaction.type_name}
                                </CustomPText>
                                <CustomPTextMin>
                                    {transaction.status}
                                </CustomPTextMin>
                            </CustomTexts>
                        </CustomInfoMovement>
                        <CustomAmountMovement className="amountMovement">
                            <CustomPText>
                                {transaction.is_positive ? "+" : "-"}
                                {typeAmount(transaction)}{" "}
                                {transaction.payment_currency}
                            </CustomPText>
                            <CustomPTextMin>{date[index]}</CustomPTextMin>
                        </CustomAmountMovement>
                    </CustomLink>
                </CustomContainer>
            ))}
        </>
    );
}
