import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_SECRET || 'kaeapp_access_secret_change_in_production';
const REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_SECRET || 'kaeapp_refresh_secret_change_in_production';

export interface TokenPayload extends JwtPayload {
  userId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Signs both access and refresh tokens for a given userId.
 * accessToken expires in 15 minutes, refreshToken in 7 days.
 */
export function signToken(userId: string): AuthTokens {
  const accessOptions: SignOptions = { expiresIn: '15m' };
  const refreshOptions: SignOptions = { expiresIn: '7d' };

  const accessToken = jwt.sign({ userId }, ACCESS_TOKEN_SECRET, accessOptions);
  const refreshToken = jwt.sign({ userId }, REFRESH_TOKEN_SECRET, refreshOptions);

  return { accessToken, refreshToken };
}

/**
 * Verifies an access token. Returns the payload or null if invalid/expired.
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Verifies a refresh token. Returns the payload or null if invalid/expired.
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Accepts a refresh token and returns a new accessToken, or null if invalid.
 */
export function refreshAccessToken(refreshToken: string): string | null {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload || !payload.userId) return null;

  const accessOptions: SignOptions = { expiresIn: '15m' };
  const newAccessToken = jwt.sign(
    { userId: payload.userId },
    ACCESS_TOKEN_SECRET,
    accessOptions
  );

  return newAccessToken;
}
