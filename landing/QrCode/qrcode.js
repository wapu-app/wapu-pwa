import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader'

function Qrcode() {

    const [data, setData] = useState('');

    const handleScan = (result) => {
        if (result) {
            setData(result);
        }
    }

    const handleError = (error) => {
        console.error(error);
    }

    return (
        <div className="qrcode">
            <div style={{ width: '30%', height: '30%' }}>
                <QrReader
                    onResult={(result, error) => {
                        if (!!result) {
                            setData(result?.text);
                        }

                        if (!!error) {
                            console.info(error);
                        }
                    }}
                    style={{ width: '100%', height: '100%' }}
                    resolution={0.2}
                />
                <div>{data}</div>
            </div>
            <div > <button className="downloadbtn">scan</button> </div>
        </div>
        
    )
}

export default Qrcode