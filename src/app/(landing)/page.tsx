import MockDiscordUI from "@/components/mock-discord-ui";
import Button from "../../components/button";
import Heading from "../../components/heading";
import { MaxWidthWrapper } from "../../components/max-width-wrapper";
import { Check } from "lucide-react";
import { AnimatedList } from "@/components/ui/animated-list";
import DiscordMessage from "@/components/discord-message";
import Image from "next/image";
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const page = () => {

  const codeSnippet = `await fetch("http://localhost:3000/api/v1/events", {
    method: "POST",
    body: JSON.stringify({
      category: "sale",
      fields: {
        plan: "PRO",
        email: "pingx@gmail.com.mm",
        amount: 52.99
      }
    }),
    headers: {
      Authorization: "Bearer <YOUR_API_KEY>"
    }
  })`

  return (
    <>
      <section>
        <MaxWidthWrapper className="text-center py-20 sm:py-28 bg-brand-25">
          <div className="relative mx-auto text-center flex flex-col items-center gap-10">
            <div>
              <Heading>
                <span>Real-Time Saas Insights,</span>
                <br />
                <span className="relative bg-gradient-to-r from-brand-700 to-brand-800 text-transparent bg-clip-text">Delivered to Your Discord</span>
              </Heading>
            </div>

            <p className="text-base/7 text-gray-600 max-w-prose text-center text-pretty">
              pingX is easiest way to monitor your Saas. Get instant notifications for {" "}
              <span className="font-semibold text-gray-700">sales, new users or any other event</span>
              {" "}sent directly to your discord.
            </p>

            <ul className="text-base/7 text-gray-600 space-y-2 flex flex-col items-start text-left">
              {[
                "Real-Time Discord alerts for critical events", 
                "Buy once, use forever", 
                "Track sales, new users or any other events"
              ].map((item, index) => (
                <li key={index} className="flex gap-1.5 items-center text-left">
                  <Check className="size-5 shrink-0 text-blue-700"/>
                  {item}
                </li>
              ))}
            </ul>

            <div className="w-full max-w-80">
              <Button href="/sign-up" className="h-14 w-full relative z-10 text-base shadow-lg transition-shadow hover:shadow-xl">Start For Free Today</Button>
            </div>
          </div>
        </MaxWidthWrapper>
      </section>

      <section className="relative bg-brand-25 pb-4">
        <div className="absolute inset-x-0 bottom-24 top-24 bg-brand-700"/>
        <div className="relative mx-auto">
          <MaxWidthWrapper>
            <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
              <MockDiscordUI>
                <AnimatedList>
                  <DiscordMessage
                    avatarSrc="/brand-asset-profile-avatar.jpg"
                    avatarAlt="pingX avatar"
                    username="ping_X"
                    timestamp="Today at 12:45AM"
                    badgeText="SignUp"
                    badgeColor="#43b581"
                    title="New user signed up"
                    content={{
                      name: "Nyeinn Dev",
                      email: "nyeindev@gmail.com.mm"
                    }}
                  />

                <DiscordMessage
                    avatarSrc="/brand-asset-profile-avatar.jpg"
                    avatarAlt="pingX Avatar"
                    username="ping_X"
                    timestamp="Today at 01:00AM"
                    badgeText="Revenue"
                    badgeColor="#faa61a"
                    title="Payment received"
                    content={{
                      amount: "$49.00",
                      email: "pingx@gmail.com.mm",
                      plan: "PRO",
                    }}
                  />

                  <DiscordMessage
                    avatarSrc="/brand-asset-profile-avatar.jpg"
                    avatarAlt="pingX Avatar"
                    username="ping_X"
                    timestamp="Today at 5:11AM"
                    badgeText="Milestone"
                    badgeColor="#5865f2"
                    title="Revenue Milestone Achieved"
                    content={{
                      recurringRevenue: "$5.000 USD",
                      growth: "+8.2%",
                    }}
                  />
                </AnimatedList>
              </MockDiscordUI>
            </div>
          </MaxWidthWrapper>
        </div>
      </section>

      <section className="relative py-24 sm:py-28 bg-brand-25">
        <MaxWidthWrapper className="flex flex-col items-center gap-14 sm:gap-20">
          <div>
            <h2 className="text-base/7 font-semibold text-center text-brand-600">Intuitive Monitoring</h2>
            <Heading>Stay ahead with real-time insights</Heading>
          </div>

          {/* grid */}
          <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
            {/* first grid */}
            <div className="relative lg:row-span-2">
              <div className="absolute inset-px bg-white rounded-lg lg:rounded-l-[2rem]"/>
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-l-[calc(2rem+1px)]">
                <div className="px-8 pb-3 pt-8 sm:px-10 sm:pb-0 sm:pt-10">
                  <p className="mt-2 text-lg/7 font-medium tracking-tight text-brand-950 max-lg:text-center">
                    Real-time Notifications
                  </p>
                  <p className="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">
                    Get notified about critical events the moment they happen,
                    no matter if you're at home or on the go.
                  </p>
                </div>

                <div className="relative min-h-[30rem] w-full grow [container-type:inline-size] max-lg:mx-auto max-lg:max-w-sm">
                  <div className="absolute inset-x-10 bottom-0 top-10 overflow-hidden rounded-t-[12cqw] border-x-[3cqw] border-t-[3cqw] border-gray-700 bg-gray-900 shadow-2xl">
                    <Image
                      src="/pingx-sm.png"
                      alt="Phone screen displaying app interface"
                      className="size-full object-cover object-top"
                      fill
                    />
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 lg:rounded-l-[2rem]" />
            </div>

            {/* second grid */}
            <div className="relative max-lg:row-start-1">
              <div className="absolute inset-px rounded-lg bg-white max-lg:rounded-t-[2rem]" />
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)]">
                <div className="px-8 pb-3 pt-8 sm:px-10 sm:pb-0 sm:pt-10">
                  <p className="mt-2 text-lg/7 font-medium tracking-tight text-brand-950 max-lg:text-center">
                    Track Any Event
                  </p>
                  <p className="mt-2 text-sm/6 text-gray-600 max-lg:text-center">
                    From new user signups to successful payments, pingX
                    notifies you for all critical events in your SaaS.
                  </p>
                </div>

                <div className="flex flex-1 items-center justify-center px-8 max-lg:pb-12 max-lg:pt-10 sm:px-10 lg:pb-2">
                    <Image
                      src="/bento-any-event.png"
                      alt="Bento box illustrating event tracking"
                      className="w-full max-lg:max-w-sm"
                      width={500}
                      height={500}
                    />
                  </div>

                <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 max-lg:rounded-t-[2rem]" />
              </div>
            </div>

            {/* third grid */}
            <div className="relative max-lg:row-start-3 lg:col-start-2 lg:row-start-2">
              <div className="absolute inset-px rounded-lg bg-white" />
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
                <div className="px-8 pt-8 sm:px-10 sm:pt-10">
                  <p className="mt-2 text-lg/7 font-medium tracking-tight text-brand-950 max-lg:text-center">
                    Track Any Properties
                  </p>
                  <p className="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">
                    Add any custom data you like to an event, such as a user
                    email, a purchase amount or an exceeded quota.
                  </p>
                </div>

                <div className="flex flex-1 items-center justify-center px-8 max-lg:pb-12 max-lg:pt-10 sm:px-10 lg:pb-2">
                  <Image
                    className="w-full max-lg:max-w-xs"
                    src="/bento-custom-data.png"
                    alt="Bento box illustrating custom data tracking"
                    width={500}
                    height={300}
                  />
                </div>
              </div>

              <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5" />
            </div>

            {/* fourth grid */}
            <div className="relative lg:row-span-2">
              <div className="absolute inset-px rounded-lg bg-white max-lg:rounded-b-[2rem] lg:rounded-r-[2rem]" />

              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-r-[calc(2rem+1px)]">
                <div className="px-8 pb-3 pt-8 sm:px-10 sm:pb-0 sm:pt-10">
                  <p className="mt-2 text-lg/7 font-medium tracking-tight text-brand-950 max-lg:text-center">
                    Easy Integration
                  </p>
                  <p className="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">
                    Connect pingX with your existing workflows in minutes and call our instuitive logging API from any language.
                  </p>
                </div>

                <div className="relative min-h-[30rem] w-full grow">
                  <div className="absolute bottom-0 left-10 right-0 top-10 overflow-hidden rounded-tl-xl bg-gray-900 shadow-2xl">
                    <div className="flex bg-gray-800/40 ring-1 ring-white/5">
                      <div className="-mb-px flex text-sm/6 font-medium text-gray-400">
                        <div className="border-b border-r border-b-white/20 border-r-white/10 bg-white/5 px-4 py-2 text-white">
                          pingx.js
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden">
                      <div className="max-h-[30rem]">
                        <SyntaxHighlighter
                          language="javascript"
                          style={{
                            ...oneDark,
                            'pre[class*="language-"]': {
                              ...oneDark['pre[class*="language-"]'],
                              background: 'transparent',
                              overflow: 'hidden'
                            },
                            'code[class*="language-"]': {
                              ...oneDark['code[class*="language-"]'],
                              background: 'transparent',
                              fontSize: '0.6rem'
                            }
                          }}
                        >
                          { codeSnippet }
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 max-lg:rounded-b-[2rem] lg:rounded-r-[2rem]" />
            </div>
          </div>
        </MaxWidthWrapper>
      </section>
    </>
  )
}

export default page;