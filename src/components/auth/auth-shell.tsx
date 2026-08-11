import Link from "next/link"
import { ReactNode } from "react"

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
    <div className="relative grid min-h-screen w-full lg:grid-cols-2">
      {/* Left: brand panel. Hidden below lg, where the form takes the screen. */}
      <div className="relative hidden overflow-hidden bg-brand-950 lg:block">
        <div className="absolute inset-0 bg-linear-to-br from-brand-600/30 via-transparent to-brand-400/20" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="absolute top-1/4 left-1/4 size-72 rounded-full bg-linear-to-r from-brand-500 to-brand-300 opacity-20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 size-96 rounded-full bg-linear-to-r from-brand-700 to-brand-500 opacity-20 blur-3xl" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-2xl font-semibold text-white">
              Ping<span className="text-brand-300">X</span>
            </span>
          </Link>

          <div className="max-w-md space-y-4">
            <blockquote className="text-lg italic text-brand-100">
              &ldquo;Ship an API call, get a Discord ping. PingX turns the events
              that matter into notifications you actually see.&rdquo;
            </blockquote>
          </div>

          <p className="text-sm text-brand-200">
            Real-time monitoring for your SaaS.
          </p>
        </div>
      </div>

      {/* Right: form column */}
      <div className="flex items-center justify-center bg-white p-6 lg:p-12">
        <div className="mx-auto w-full max-w-100 space-y-8">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-lg font-semibold text-brand-950 lg:hidden"
          >
            Ping<span className="text-brand-700">X</span>
          </Link>

          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-brand-950">
              {title}
            </h1>
            <p className="text-gray-600">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
