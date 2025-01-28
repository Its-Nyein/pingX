import Link from "next/link";
import { MaxWidthWrapper } from "./max-width-wrapper";
import {SignOutButton} from '@clerk/nextjs';
import { Button, buttonVariants } from "./ui/button";
import { ArrowRight } from "lucide-react";

const Navbar = () => {
  const user = false;

  return (
    <nav className="sticky z-[100] h-16 inset-x-0 top-0 border-b border-gray-200 bg-white/80 transition-all backdrop-blur-lg">
        <MaxWidthWrapper>
            <div className="flex justify-between h-16 items-center">
              <Link href="/" className="flex z-50 text-xl md:text-2xl font-semibold">
                Ping<span className="text-brand-700">X</span>
              </Link>

              <div className="flex h-full items-center space-x-3">
                {user ? (
                    <>
                        <SignOutButton>
                            <Button size="sm" variant="outline">Sign Out</Button>
                        </SignOutButton>

                        <Link 
                          href="/dashboard"
                          className={buttonVariants({
                            size: "sm",
                            className: "flex items-center gap-1"
                          })}
                          >
                            Dashboard <ArrowRight className="size-4 ml-1.5"/>
                        </Link>
                    </>
                ) : (
                    <>
                        <Link 
                          href="/princing"
                          className={buttonVariants({
                            size: "sm",
                            variant: "ghost"
                          })}
                          >
                            Princing
                        </Link>

                        <Link 
                          href="/sign-in"
                          className={buttonVariants({
                            size: "sm",
                            variant: "outline"
                          })}
                          >
                            Sign In
                        </Link>

                        <div className="hidden md:flex h-8 w-px bg-gray-200" />

                        <Link 
                          href="/sign-up"
                          className={buttonVariants({
                            size: "sm",
                            className: "flex items-center gap-1"
                          })}
                          >
                            Sign Up <ArrowRight className="hidden md:flex size-4 ml-1"/>
                        </Link>
                    </>
                )}
              </div>
            </div>
        </MaxWidthWrapper>
    </nav>
  )
}

export default Navbar