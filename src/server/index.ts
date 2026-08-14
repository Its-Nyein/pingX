import { Hono } from "hono"
import { cors } from "hono/cors"
import { handle } from "hono/vercel"
import { categoryRouter } from "./routers/category-router"
import { paymentRouter } from "./routers/payment-router"
import { projectRouter } from "./routers/project-router"

const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

const app = new Hono().basePath("/api").use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
)

const appRouter = app
  .route("/category", categoryRouter)
  .route("/payment", paymentRouter)
  .route("/project", projectRouter)

export const httpHandler = handle(app)

export default app

export type AppType = typeof appRouter