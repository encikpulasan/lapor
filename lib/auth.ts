import { encodeBase64 } from "@std/encoding/base64";
import { SessionDB, type User, UserDB } from "./db.ts";

// Authentication utilities
export class AuthService {
  // Hash password using Web Crypto API
  static async hashPassword(
    password: string,
    salt?: Uint8Array,
  ): Promise<{ hash: string; salt: string }> {
    if (!salt) {
      salt = crypto.getRandomValues(new Uint8Array(16));
    }

    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    // Combine password and salt
    const combined = new Uint8Array(passwordData.length + salt.length);
    combined.set(passwordData);
    combined.set(salt, passwordData.length);

    // Hash with SHA-256
    const hashBuffer = await crypto.subtle.digest("SHA-256", combined);

    return {
      hash: encodeBase64(hashBuffer),
      salt: encodeBase64(salt),
    };
  }

  // Verify password
  static async verifyPassword(
    password: string,
    hash: string,
    salt: string,
  ): Promise<boolean> {
    try {
      const saltBytes = new Uint8Array(
        atob(salt).split("").map((c) => c.charCodeAt(0)),
      );
      const { hash: newHash } = await this.hashPassword(password, saltBytes);
      return newHash === hash;
    } catch (error) {
      console.error("Password verification error:", error);
      return false;
    }
  }

  // Register new user
  static async register(
    email: string,
    password: string,
    name: string,
    phone?: string,
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Check if user already exists
      const existingUser = await UserDB.getByEmail(email);
      if (existingUser) {
        return { success: false, error: "User already exists with this email" };
      }

      // Hash password
      const { hash, salt } = await this.hashPassword(password);
      const passwordHash = `${hash}:${salt}`;

      // Create user
      const user = await UserDB.create({
        email,
        password_hash: passwordHash,
        name,
        phone,
        is_admin: false,
      });

      return { success: true, user };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "Registration failed" };
    }
  }

  // Login user
  static async login(
    email: string,
    password: string,
  ): Promise<
    { success: boolean; user?: User; sessionId?: string; error?: string }
  > {
    try {
      // Get user by email
      const user = await UserDB.getByEmail(email);
      if (!user) {
        return { success: false, error: "Invalid email or password" };
      }

      // Verify password
      const [hash, salt] = user.password_hash.split(":");
      const isValid = await this.verifyPassword(password, hash, salt);

      if (!isValid) {
        return { success: false, error: "Invalid email or password" };
      }

      // Create session
      const session = await SessionDB.create(user.user_id);

      return {
        success: true,
        user,
        sessionId: session.session_id,
      };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Login failed" };
    }
  }

  // Get user from session
  static async getUserFromSession(sessionId: string): Promise<User | null> {
    try {
      const session = await SessionDB.getById(sessionId);
      if (!session) return null;

      return await UserDB.getById(session.user_id);
    } catch (error) {
      console.error("Session lookup error:", error);
      return null;
    }
  }

  // Logout user
  static async logout(sessionId: string): Promise<boolean> {
    try {
      await SessionDB.delete(sessionId);
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      return false;
    }
  }

  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  static isValidPassword(password: string): { valid: boolean; error?: string } {
    if (password.length < 8) {
      return {
        valid: false,
        error: "Password must be at least 8 characters long",
      };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return {
        valid: false,
        error: "Password must contain at least one lowercase letter",
      };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return {
        valid: false,
        error: "Password must contain at least one uppercase letter",
      };
    }

    if (!/(?=.*\d)/.test(password)) {
      return {
        valid: false,
        error: "Password must contain at least one number",
      };
    }

    return { valid: true };
  }

  // Get session ID from request cookies
  static getSessionFromCookies(request: Request): string | null {
    const cookies = request.headers.get("cookie");
    if (!cookies) return null;

    const sessionCookie = cookies
      .split(";")
      .find((cookie) => cookie.trim().startsWith("sessionId="));

    if (!sessionCookie) return null;

    return sessionCookie.split("=")[1];
  }

  // Create session cookie
  static createSessionCookie(sessionId: string): string {
    const maxAge = 24 * 60 * 60; // 24 hours
    return `sessionId=${sessionId}; HttpOnly; SameSite=Strict; Max-Age=${maxAge}; Path=/`;
  }
}
