// Development authentication bypass
// This should only be used in development mode

export interface DevUser {
  id: string;
  email: string;
  username: string;
}

export const DEV_USER: DevUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "admin@example.com",
  username: "admin",
};

export function isDevMode(): boolean {
  return process.env.NODE_ENV === "development";
}

export function validateDevCredentials(
  email: string,
  password: string,
): boolean {
  if (!isDevMode()) return false;

  return (
    (email === "admin" || email === "admin@example.com") && password === "admin"
  );
}

export function createDevSession(): DevUser {
  return DEV_USER;
}
