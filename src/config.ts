export const FREE_QUOTA = {
    maxEventsPerMonth: 100,
    maxEventCategories: 3,
  } as const

  export const PRO_QUOTA = {
    maxEventsPerMonth: 1000,
    maxEventCategories: 10,
  } as const

  export const RATE_LIMIT = {
    requestsPerMinute: 60,
    testEventsPerMinute: 5,
  } as const

  export const RETENTION = {
    freeDays: 30,
    proDays: 365,
    graceDays: 30,
  } as const

  export const DELETE_CONFIRMATION = "Confirm"
