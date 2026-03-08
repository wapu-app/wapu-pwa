import React from "react";
import Link from "next/link";
import Image from "next/image";
import Survivors from "/public/survivorslogo.png";
import {
  AiFillInstagram,
  AiOutlineTwitter,
  AiFillFacebook,
} from "react-icons/ai";

function footer() {
  return (
    <div className="footer">
      
      <div className="map">
        <div className="logo">
          <Link className="button" href="#landing">
            <Image src={Survivors} alt="Logo" width={60} height={60} />
          </Link>
        </div>
        <div className="mapNav">
          <Link className="button" href="#features">
            <div> Características </div>
          </Link>
          <Link className="button" href="#aboutUs">
            <div> Nosotros </div>
          </Link>
          <Link className="button" href="#contact">
            <div> Contacto </div>
          </Link>
        </div>
        <div className="socialLinks">
          <a href="https://facebook.com" target="_blank"><AiFillFacebook /></a>
          <a href="https://twitter.com" target="_blank"><AiOutlineTwitter /></a>
          <a href="https://instagram.com" target="_blank"><AiFillInstagram /></a>
          
        </div>
      </div>
      <div className="copy">
        <p>© 2023 Survivors. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}

export default footer;
