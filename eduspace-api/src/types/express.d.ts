import { AuthUser } from "../lib/access";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};