import { jwtVerify, SignJWT } from "jose";

import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_S } from "./admin-constants";
import { normalizeEnvString } from "./normalize-env";

function getSecretBytes(): Uint8Array | null {
  const raw = normalizeEnvString(process.env.ADMIN_SESSION_SECRET);
  if (!raw || raw.length < 32) return null;
  return new TextEncoder().encode(raw);
}

export async function verifyAdminJwt(token: string | undefined): Promise<boolean> {
  const payload = await getJwtPayload(token);
  return payload !== null;
}

export async function getJwtPayload(
  token: string | undefined,
): Promise<{ sub: string } | null> {
  if (!token) return null;
  const secret = getSecretBytes();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    if (!sub) return null;
    return { sub };
  } catch {
    return null;
  }
}

export async function signAdminJwt(email: string): Promise<string | null> {
  const secret = getSecretBytes();
  if (!secret) return null;
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_MAX_AGE_S}s`)
    .sign(secret);
}

export { ADMIN_SESSION_COOKIE };
