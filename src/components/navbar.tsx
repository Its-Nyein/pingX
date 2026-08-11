import Link from "next/link";
import { MaxWidthWrapper } from "./max-width-wrapper";
import { SignOutButton } from "./sign-out-button";
import { buttonVariants } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const Navbar = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;

  return (
    <nav className="sticky z-100 h-16 inset-x-0 top-0 border-b border-border bg-card/80 transition-all backdrop-blur-lg">
        <MaxWidthWrapper>
            <div className="flex justify-between h-16 items-center">
              <Link href="/" className="flex z-50 text-xl md:text-2xl font-semibold">
                Ping<span className="text-link">X</span>
              </Link>

              <div className="flex h-full items-center space-x-3">
                {user ? (
                    <>
                        <SignOutButton />

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
                          href="/pricing"
                          className={buttonVariants({
                            size: "sm",
                            variant: "ghost"
                          })}
                          >
                            Pricing
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

                        <div className="hidden md:flex h-8 w-px bg-recessed" />

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
