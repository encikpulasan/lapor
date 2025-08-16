/// <reference lib="deno.unstable" />
import { UserDB } from "./db.ts";
import { AuthService } from "./auth.ts";
import { seedDefaultData } from "./seed-data.ts";

// Server setup and initialization functions
export class ServerSetup {
  // Create default admin account if no admin exists
  static async ensureAdminAccount(): Promise<void> {
    try {
      console.log("Checking for admin account...");

      // Check if any admin user exists
      const adminExists = await this.hasAdminUser();

      if (!adminExists) {
        console.log("No admin account found. Creating default admin...");
        await this.createDefaultAdmin();
        console.log("✅ Default admin account created successfully");
      } else {
        console.log("✅ Admin account already exists");
      }
    } catch (error) {
      console.error("❌ Error ensuring admin account:", error);
      throw error;
    }
  }

  // Check if any admin user exists in the database
  private static async hasAdminUser(): Promise<boolean> {
    try {
      // Since we don't have a direct way to query all users efficiently,
      // we'll use a simple approach and check a few common admin emails
      const commonAdminEmails = [
        "admin@lapor.local",
        "admin@localhost",
        "administrator@lapor.local",
        Deno.env.get("ADMIN_EMAIL") || "admin@lapor.local",
      ];

      for (const email of commonAdminEmails) {
        const user = await UserDB.getByEmail(email);
        if (user && user.is_admin) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Error checking for admin users:", error);
      return false;
    }
  }

  // Create default admin account
  private static async createDefaultAdmin(): Promise<void> {
    // Get admin credentials from environment variables or use defaults
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@lapor.local";
    const adminPassword = Deno.env.get("ADMIN_PASSWORD") || "Admin123!";
    const adminName = Deno.env.get("ADMIN_NAME") || "System Administrator";
    const adminPhone = Deno.env.get("ADMIN_PHONE");

    // Validate password meets requirements
    const passwordValidation = AuthService.isValidPassword(adminPassword);
    if (!passwordValidation.valid) {
      throw new Error(
        `Default admin password is invalid: ${passwordValidation.error}`,
      );
    }

    // Check if user already exists with this email
    const existingUser = await UserDB.getByEmail(adminEmail);
    if (existingUser) {
      if (!existingUser.is_admin) {
        console.log(
          `User ${adminEmail} exists but is not admin. This needs manual intervention.`,
        );
        return;
      }
      console.log(`Admin user ${adminEmail} already exists`);
      return;
    }

    // Create admin account
    const result = await AuthService.register(
      adminEmail,
      adminPassword,
      adminName,
      adminPhone,
    );

    if (!result.success) {
      throw new Error(`Failed to create admin account: ${result.error}`);
    }

    // Update user to be admin (since register creates regular users)
    if (result.user) {
      // We need to manually set the admin flag since the register function doesn't support it
      // This is a bit hacky but necessary for the initial setup
      const { kv } = await import("./db.ts");
      const adminUser = { ...result.user, is_admin: true };
      await kv.set(["users", result.user.user_id], adminUser);

      // Update the email index as well to maintain consistency
      await kv.set(["users_by_email", adminEmail], result.user.user_id);
    }

    console.log(`📧 Admin Account Created:`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Name: ${adminName}`);
    if (adminPhone) {
      console.log(`   Phone: ${adminPhone}`);
    }

    if (adminPassword === "Admin123!") {
      console.log(
        `⚠️  WARNING: Using default password! Please change it after first login.`,
      );
      console.log(
        `   Set ADMIN_PASSWORD environment variable for custom password.`,
      );
    }
  }

  // Run all setup tasks
  static async initialize(): Promise<void> {
    console.log("🚀 Initializing server setup...");

    try {
      await this.ensureAdminAccount();
      await seedDefaultData();
      console.log("✅ Server setup completed successfully");
    } catch (error) {
      console.error("❌ Server setup failed:", error);
      throw error;
    }
  }
}
