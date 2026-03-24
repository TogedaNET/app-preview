import { createHmac } from "crypto";
import { env } from "~/env.js";

export interface ProfileData {
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  location: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  interests: Array<{ name: string; icon: string; category: string }>;
}

export function computeSecretHash(username: string): string {
  return createHmac("sha256", env.COGNITO_CLIENT_SECRET)
    .update(username + env.COGNITO_CLIENT_ID)
    .digest("base64");
}

export function cognitoEndpoint(): string {
  const region = env.COGNITO_USER_POOL_ID.split("_")[0]!;
  return `https://cognito-idp.${region}.amazonaws.com/`;
}

async function cognitoRequest(action: string, body: Record<string, unknown>) {
  const endpoint = cognitoEndpoint();
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = new Error((data.message as string) ?? "Cognito error");
    (err as NodeJS.ErrnoException).code = (data.__type as string) ?? "UnknownError";
    throw err;
  }
  return data;
}

export async function cognitoSignUp(email: string, password: string) {
  return cognitoRequest("SignUp", {
    ClientId: env.COGNITO_CLIENT_ID,
    SecretHash: computeSecretHash(email),
    Username: email,
    Password: password,
    UserAttributes: [{ Name: "email", Value: email }],
  });
}

export async function cognitoConfirmSignUp(email: string, code: string) {
  return cognitoRequest("ConfirmSignUp", {
    ClientId: env.COGNITO_CLIENT_ID,
    SecretHash: computeSecretHash(email),
    Username: email,
    ConfirmationCode: code,
  });
}

export async function cognitoInitiateAuth(email: string, password: string) {
  return cognitoRequest("InitiateAuth", {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: env.COGNITO_CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
      SECRET_HASH: computeSecretHash(email),
    },
  }) as Promise<{ AuthenticationResult: { AccessToken: string } }>;
}

export async function cognitoResendCode(email: string) {
  return cognitoRequest("ResendConfirmationCode", {
    ClientId: env.COGNITO_CLIENT_ID,
    SecretHash: computeSecretHash(email),
    Username: email,
  });
}

export async function createUserProfile(
  token: string,
  profileData: ProfileData,
  backendUrl: string
) {
  const phoneNumber = String(Math.floor(1000000000 + Math.random() * 9000000000));

  const res = await fetch(`${backendUrl}/users/addBasicInfo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      subToEmail: true,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      gender: profileData.gender,
      birthDate: profileData.birthDate,
      visibleGender: true,
      location: profileData.location,
      occupation: "working",
      profilePhotos: [
        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
      ],
      interests: profileData.interests,
      phoneNumber,
      referralCodeUsed: null,
    }),
  });

  return res;
}
