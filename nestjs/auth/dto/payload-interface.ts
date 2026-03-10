export interface JwtPayload {
  id: number;
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}
