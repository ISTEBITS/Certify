import { Logo } from "./Logo"

export const Navbar = () => {
    return (
        <div className="flex items-center justify-left max-w-5xl mx-auto px-4 p-2 gap-8">
            <Logo />
            <div className="">
                <h1 className="font-bold">ISTE Students' Chapter</h1>
                <p className="text-xs">BIT Sindri</p>
            </div>
        </div>
    )
}