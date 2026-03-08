 import React from "react";
 import etherBackground from "../../../public/etherIllustration.svg"
 import ether from "../../../public/ether.svg"
 import Image from "next/image";



 function Features () {
    return (
        <div className="features" id="features">
            <div className="illustration">
             <Image src={etherBackground} width={650} height={580} />
                <div className="containerEther">
                <Image src={ether} alt="ilustracion de 2 personas" width={280} height={391} />
                </div>
            </div>
            <div className="texts">
                <p className="1">Nuestro objetivo es brindar una solución segura y fácil de usar para aquellos que prefieren utilizar criptomonedas en sus transacciones diarias.</p>
                <p className="segundo">Al utilizar nuestra aplicación, los usuarios depositan sus USDT en su billetera virtual y convertirlos automáticamente a pesos argentinos. Luego, pueden realizar pagos escaneando un código QR.</p>
                <p className="tercero">Además, ofrecemos una experiencia de usuario intuitiva y segura, utilizando tecnología de encriptación y medidas de seguridad avanzadas para proteger los fondos de nuestros usuarios.</p>
            </div>
        </div>
    )
 }

 export default Features