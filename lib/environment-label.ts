// Public build-time label only. Credentials and target validation stay in server modules.
export const isPilot = process.env.NEXT_PUBLIC_APP_ENV === "pilot";
export const environmentLabel = process.env.NEXT_PUBLIC_APP_ENV === "production" ? "Operations" : isPilot ? "Pilot" : "Development";
