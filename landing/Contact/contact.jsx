import React from "react";
import android from "../../../public/androidDownload.svg"
import ios from "../../../public/iosDownload.svg"
import illustration from "../../../public/download.svg"

import Image from "next/image";

function Contact () {

    return (
        <div className="contact" id="contact">
            <div className="texts">
                <h2>Descargá la app</h2>
                <p>¡Descarga nuestra app y experimenta la libertad de utilizar criptomonedas en tu vida cotidiana!</p>
                <div className="buttonsDownload">
                    <Image src={android} alt="botón para descargar la app en android" width={135} height={50}/>
                    <Image src={ios} alt="botón para descargar la app en ios" width={135} height={50} />
                </div>
            </div>
            <div className="illustration">
            <Image src={illustration} alt="botón para descargar la app en android" width={480} height={420}/>
            </div>
            
        </div>
    ) 
}

export default Contact