import React from 'react'
import Image from 'next/image'
import Link from 'next/link'


import Survivors from '/public/survivorslogo.png'

import Signup from '../SignUp/signup'
import Signin from '../SignIn/signin'

function Navbar() {
    return (
    <div className="navbar">
        <div className="logo">
            <Image 
                src={Survivors}
                alt="Logo"
                id='coin'
                width={60}
                height={60}
            />
            <a>SURVIVORS</a>
        </div>
        
        <div className="buttons_mid">
                <Link className="button" rel='noreferrer' smooth="true" offset={-50} duration={500} href="#features" >
                    <div> Características</div>
                </Link>
                <Link className="button" rel='noreferrer' smooth="true" offset={-50} duration={500} href="#aboutUs">
                    <div> Nosotros</div>
                </Link>
                <Link className="button" rel='noreferrer' smooth="true" offset={-50} duration={500} href="#contact">
                    <div> Contacto </div>
                </Link>
        </div>

        <div className="buttons_right">
                <Signup />
                <Signin />
        </div>
        
    </div>
    )
}

export default Navbar