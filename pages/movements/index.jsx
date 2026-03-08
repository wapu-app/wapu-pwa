import { useEffect, useState } from "react";
import moment from "moment";
import { getTransactions } from "../../api/api";
import { CustomContainer, CustomText, Spinner } from "./styled";
import Movement from "../../components/Movement/index";

export default function MovementsPage() {
    const [userMovements, setUserMovements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [date, setDate] = useState([]);

    const fetchTransactions = async () => {
        try {
            setIsLoading(true);
            const response = await getTransactions();
            setUserMovements(response.data.transactions);
            setDate(
                response.data.transactions.map((obj) =>
                    moment(obj.updated_at).format("MMM Do")
                )
            );
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    return (
        <>
            <CustomContainer>
                <CustomText>Movements</CustomText>
                {isLoading ? (
                    <Spinner />
                ) : (
                    <Movement userMovements={userMovements} date={date} />
                )}
            </CustomContainer>
        </>
    );
}
