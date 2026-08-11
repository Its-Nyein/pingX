import { Activity, ShieldCheck, Zap } from "lucide-react"
import Link from "next/link"
import { ReactNode } from "react"

const HIGHLIGHTS = [
  { icon: Zap, text: "One API call, one Discord ping" },
  { icon: Activity, text: "Track events by category" },
  { icon: ShieldCheck, text: "Per-key quotas and delivery status" },
]

export const AuthShell = ({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) => {
  return (
    <div className="relative grid min-h-screen w-full lg:grid-cols-[1.1fr_1fr]">

      <div className="relative hidden overflow-hidden bg-[#0b1020] lg:block">

        <div className="absolute -left-1/4 -top-1/3 size-184 rounded-full bg-[radial-gradient(circle,#3b82f6_0%,transparent_65%)] opacity-30 blur-3xl" />
        <div className="absolute -bottom-1/3 -right-1/4 size-168 rounded-full bg-[radial-gradient(circle,#6366f1_0%,transparent_65%)] opacity-30 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 size-120 rounded-full bg-[radial-gradient(circle,#22d3ee_0%,transparent_60%)] opacity-15 blur-3xl" />

        <div
          aria-hidden
          className="absolute inset-0 opacity-18"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(ellipse 80% 70% at 50% 45%, black 35%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 70% at 50% 45%, black 35%, transparent 100%)",
          }}
        />

        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-[#0b1020] to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-[#0b1020] to-transparent"
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <Link
            href="/"
            className="w-fit text-2xl font-semibold tracking-tight text-white"
          >
            Ping<span className="text-cloudflare-orange">X</span>
          </Link>

          <div className="space-y-8">
            <p className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-white">
              Turn the events that matter into notifications you actually see.
            </p>

            <ul className="space-y-3">
              {HIGHLIGHTS.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-3 text-sm text-white/75"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 backdrop-blur-sm">
                    <Icon className="size-3.5 text-white/80" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/45">
            Real-time monitoring for your SaaS.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-background p-6 lg:p-12">
        <div className="w-full max-w-100 space-y-8">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-lg font-semibold text-foreground lg:hidden"
          >
            Ping<span className="text-cloudflare-orange">X</span>
          </Link>

          <div className="space-y-1.5 text-center lg:text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
