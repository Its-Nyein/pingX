
import { AnchorHTMLAttributes } from "react"
import Link from "next/link"
import { cn } from "../lib/utils"
import { ArrowRight } from "lucide-react"

interface ButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {}

const Button = ({children, className, href, ...props}: ButtonProps) => {
  return (
    <Link 
      href={href ?? '#'}
      className={cn(
        "group relative flex transform items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-md border border-white bg-brand-700 px-8 text-base/7 text-white font-medium transition-all duration-300 hover:ring-2 hover:ring-brand-700 hover:ring-offset-2 focus:outline-none focus:ring-2 focus:ring-brand-700", 
        className)}
        {...props}
      >
        <span className="relative flex z-10 items-center gap-2"> 
            {children}
            <ArrowRight className="size-4 shrink-0 text-white transition-transform duration-300 ease-in-out group-hover:translate-x-[2px]"/>
        </span>

        <div className="ease-[cubic-bezier(0.19,1,0.22,1)] absolute -left-[75px] -top-[50px] -z-10 h-[155px] w-8 rotate-[35deg] bg-white opacity-20 transition-all duration-700 group-hover:left-[120%]"/>
    </Link>
  )
}

export default Button