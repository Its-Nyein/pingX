import { Button } from "@/components/ui/button"

export const SourceLink = ({
  href = "https://github.com/itsnyein/pingX",
}: {
  href?: string
}) => (
  <Button
    variant="ghost"
    size="sm"
    asChild
    className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
  >
    <a href={href} target="_blank" rel="noreferrer">
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
        <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.8 10.9.6.1.8-.2.8-.6v-2.1c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.4.1-3 0 0 1-.3 3.3 1.2.9-.3 1.9-.4 2.9-.4s2 .1 2.9.4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.7.1 3 .8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.5-5.4 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.5-1.5 7.8-5.8 7.8-10.9C23.5 5.7 18.3.5 12 .5z" />
      </svg>
      Source
    </a>
  </Button>
)
