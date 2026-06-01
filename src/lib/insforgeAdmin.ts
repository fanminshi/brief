import { createAdminClient } from "@insforge/sdk";

export const insforgeAdmin = createAdminClient({
  baseUrl: process.env.INSFORGE_URL!,
  apiKey: process.env.INSFORGE_API_KEY!,
});
