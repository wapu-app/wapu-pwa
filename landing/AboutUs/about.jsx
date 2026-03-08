import React from "react";
import {HiOutlineLightBulb} from "react-icons/hi";
import {MdOutlineCenterFocusWeak} from "react-icons/md";
import {RiTeamLine} from "react-icons/ri";

function About() {
    return (
        <div className="about" id="aboutUs">
            <div className="texts">
                <h2>¿Quiénes somos?</h2>
                <p>Somos una empresa de tecnología financiera comprometida en brindar soluciones innovadoras para el uso de criptomonedas en el mundo real.</p>
            </div>
            <div className="cards">
                <div className="card">
                    <div className="icon">
                        <HiOutlineLightBulb/>
                    </div>
                    <p>Ofrecemos una solución que permite a los usuarios utilizar criptomonedas para hacer compras y transacciones en el mundo real</p>
                </div>
                <div className="card">
                    <div className="icon">
                        <MdOutlineCenterFocusWeak/>
                    </div>
                    <p>Nuestro objetivo es hacer que la adopción de criptomonedas sea accesible y práctica para todos, y aspiramos a liderar en este campo e innovar en el futuro.</p>
                </div>
                <div className="card">
                    <div className="icon">
                        <RiTeamLine/>
                    </div>
                    <p>Contamos con un equipo experto en tecnología financiera y criptomonedas que se enfoca en mejorar constantemente y satisfacer las necesidades de nuestros usuarios.</p>
                </div>
            </div>
        </div>
    )
}

export default About 