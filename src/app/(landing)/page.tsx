import MockDiscordUI from "@/components/mock-discord-ui";
import Button from "../../components/button";
import Heading from "../../components/heading";
import { MaxWidthWrapper } from "../../components/max-width-wrapper";
import { Check } from "lucide-react";

const page = () => {
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
              <MockDiscordUI></MockDiscordUI>
            </div>
          </MaxWidthWrapper>
        </div>
      </section>
    </>
  )
}

export default page;