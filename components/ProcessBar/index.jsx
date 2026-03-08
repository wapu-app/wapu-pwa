import { Steps } from "rsuite";
import { useEffect, useState } from "react";
export default function ProcessBar({ status }) {
    const [current, setCurrent] = useState(0);
    const [currentStatus, setCurrentStatus] = useState("");

    const transactionStatus = () => {
        if (status === "Pending") {
            setCurrent(1);
        } else if (status === "Processing") {
            setCurrent(2);
        } else if (status === "Paid") {
            setCurrent(3);
        } else if (status === "Canceled") {
            setCurrent((prevCurrent) => prevCurrent);
            setCurrentStatus("error");
        }
    };
    useEffect(() => {
        transactionStatus();
    }, [status]);
    return (
        <>
            <Steps
                current={current}
                currentStatus={currentStatus}
                small
                style={{ width: "100%", display: "flex" }}
            >
                <Steps.Item title="Pending" style={{ width: "100%" }} />
                <Steps.Item title="Processing" style={{ width: "100%" }} />
                <Steps.Item title="Paid" style={{ width: "100%" }} />
            </Steps>
        </>
    );
}
