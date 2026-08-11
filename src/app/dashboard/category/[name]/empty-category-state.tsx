import { Card } from "@/components/ui/card"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism"

export const EmptyCategoryState = ({
  categoryName,
}: {
  categoryName: string
}) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

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
        <div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
          <div className="flex space-x-2">
            <div className="size-3 rounded-full bg-red-500" />
            <div className="size-3 rounded-full bg-yellow-500" />
            <div className="size-3 rounded-full bg-green-500" />
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
          <div className="size-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground">
            Listening to incoming events...
          </span>
        </div>

        <p className="text-sm/6 text-muted-foreground mt-2">
          Need help? Check out our{" "}
          <a href="#" className="text-blue-600 hover:underline">
            documentation
          </a>{" "}
          or{" "}
          <a href="#" className="text-blue-600 hover:underline">
            contact support
          </a>
          .
        </p>
      </div>
    </Card>
  )
}
