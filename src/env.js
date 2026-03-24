import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    BACKEND_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    COGNITO_CLIENT_ID: z.string().min(1),
    COGNITO_CLIENT_SECRET: z.string().min(1),
    COGNITO_USER_POOL_ID: z.string().min(1),
    COGNITO_SERVICE_USERNAME: z.string().min(1),
    COGNITO_SERVICE_PASSWORD: z.string().min(1),
  },

  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },

  runtimeEnv: {
    BACKEND_URL: process.env.BACKEND_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
    COGNITO_CLIENT_SECRET: process.env.COGNITO_CLIENT_SECRET,
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
    COGNITO_SERVICE_USERNAME: process.env.COGNITO_SERVICE_USERNAME,
    COGNITO_SERVICE_PASSWORD: process.env.COGNITO_SERVICE_PASSWORD,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
