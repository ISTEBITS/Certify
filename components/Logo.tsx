import Image from "next/image"

export const Logo = () => {
    return (
        <Image 
            src="/assets/logo/logo.png"
            alt="Logo"
            width={60}
            height={60}
        />
    )
}