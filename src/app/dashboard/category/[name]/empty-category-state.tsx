import { Card } from "@/components/ui/card"
import { appUrl } from "@/lib/app-url"
import Link from "next/link"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism"

export const EmptyCategoryState = ({
  categoryName,
}: {
  categoryName: string
}) => {
  const baseUrl = appUrl()

  const codeSnippet = `await fetch('${baseUrl}/api/v1/events', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    category: '${categoryName}',
    data: {
      field1: 'value1',
      field2: 'value2'
    }
  })
})`

  return (
    <Card
      contentClassName="max-w-2xl w-full flex flex-col items-center p-6"
      className="flex-1 flex items-center justify-center"
    >
      <h2 className="text-xl/8 font-medium text-center tracking-tight text-foreground">
        Create your first {categoryName} event
      </h2>
      <p className="text-sm/6 text-muted-foreground mb-8 max-w-md text-center text-pretty">
        Get started by sending a request to our tracking API:
      </p>

      <div className="w-full max-w-3xl bg-card rounded-lg shadow-lg overflow-hidden">
        <div className="bg-recessed border-b border-border px-4 py-2 flex justify-between items-center">
          <div className="flex space-x-2">
            <div className="size-3 rounded-full bg-danger" />
            <div className="size-3 rounded-full bg-warning" />
            <div className="size-3 rounded-full bg-success" />
          </div>

          <span className="text-muted-foreground text-sm">your-event.js</span>
        </div>

        <SyntaxHighlighter
          language="javascript"
          style={atomDark}
          customStyle={{
            borderRadius: "0px",
            margin: 0,
            padding: "1rem",
            fontSize: "0.875rem",
            lineHeight: "1.5",
          }}
        >
          {codeSnippet}
        </SyntaxHighlighter>
      </div>

      <div className="mt-8 flex flex-col items-center space-x-2">
        <div className="flex gap-2 items-center">
          <div className="size-2 bg-success rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground">
            Listening to incoming events...
          </span>
        </div>

        <p className="text-sm/6 text-muted-foreground mt-2">
          Need help? Check out our{" "}
          <Link href="/dashboard/docs" className="text-link hover:underline">
            documentation
          </Link>{" "}
          or{" "}
          <Link href="/dashboard/support" className="text-link hover:underline">
            contact support
          </Link>
          .
        </p>
      </div>
    </Card>
  )
}
