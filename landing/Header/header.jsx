import React from "react";
import illustration from "../../../public/illustrationHeader.svg";
import illustrationBackground from "../../../public/background.svg";
import Image from "next/image";
import Link from 'next/link';

function Header() {
  return (
    <div className="header" id="landing">
      <div className="texts">
        <h1>
          ¡Bienvenidos al futuro de los pagos!
          Transforma tus criptomonedas en poder de compra real
          y paga en cualquier lugar del mundo sin complicaciones
        </h1>
        <p>
          Únete a nuestra plataforma y descubre cómo revolucionar
          la forma en que realizas tus pagos. ¡El futuro ya está aquí!
        </p>
      </div>
      <div className="illustration">
        <Image
          src={illustrationBackground} 
          alt="ilustración de 2 personas intercambiando un bitcoin"
          width={750}
          height={630}
        />
        <div className="containerPersons">
          <Image src={illustration} className="persons"alt="ilustración de 2 personas intercambiando un bitcoin"  width={488} height={321} />
        </div>
        
      </div>
    </div>
  );
}

export default Header