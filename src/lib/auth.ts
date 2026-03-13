import { createHmac } from "crypto";
import { env } from "~/env.js";

interface TokenCache {
  token: string;
  expiresAt: number;
}

let cache: TokenCache | null = null;

function computeSecretHash(username: string): string {
  return createHmac("sha256", env.COGNITO_CLIENT_SECRET)
    .update(username + env.COGNITO_CLIENT_ID)
    .digest("base64");
}

export async function getServiceToken(): Promise<string> {
  if (cache && Date.now() < cache.expiresAt - 60_000) {
    return cache.token;
  }

  const response = await fetch(
    `https://cognito-idp.${env.COGNITO_USER_POOL_ID.split("_")[0]}.amazonaws.com/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-amz-json-1.1",
        "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
      },
      body: JSON.stringify({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: env.COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: env.COGNITO_SERVICE_USERNAME,
          PASSWORD: env.COGNITO_SERVICE_PASSWORD,
          SECRET_HASH: computeSecretHash(env.COGNITO_SERVICE_USERNAME),
        },
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Cognito auth failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as {
    AuthenticationResult: {
      AccessToken: string;
      ExpiresIn: number;
    };
  };
  cache = {
    token: data.AuthenticationResult.AccessToken,
    expiresAt: Date.now() + data.AuthenticationResult.ExpiresIn * 1000,
  };

  return cache.token;
}
