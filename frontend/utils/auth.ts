// utils/auth.ts
import { jwtDecode } from "jwt-decode";

type DecodedUser = {
  id: string;
  username: string;
  email: string;
  name?: string;
  location?: string;
  exp: number;
};

export function decodeToken(token: string): DecodedUser | null {
  try {
    return jwtDecode<DecodedUser>(token);
  } catch (err) {
    console.error("Invalid token", err);
    return null;
  }
}
