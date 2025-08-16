import { define } from "../../../utils.ts";
import { type User, UserDB } from "../../../lib/db.ts";

export const handler = define.handlers({
  async GET(ctx) {
    // Check if user is admin
    if (!ctx.state.user?.is_admin) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    try {
      // Get all users
      const users = [];
      const iter = UserDB.kv.list<User>({ prefix: ["users"] });

      for await (const entry of iter) {
        const user = entry.value;
        // Don't return password hash
        const { password_hash: _password_hash, ...safeUser } = user;
        users.push(safeUser);
      }

      // Sort by creation date (newest first)
      users.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return Response.json({
        success: true,
        users: users,
      });
    } catch (error) {
      console.error("Failed to fetch users:", error);
      return Response.json({ error: "Failed to fetch users" }, { status: 500 });
    }
  },

  async PUT(ctx) {
    // Check if user is admin
    if (!ctx.state.user?.is_admin) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    try {
      const body = await ctx.req.json();
      const { user_id, is_admin, name, email, phone } = body;

      if (!user_id) {
        return Response.json({ error: "User ID is required" }, { status: 400 });
      }

      // Get existing user
      const existingUser = await UserDB.get(user_id);
      if (!existingUser) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      // Prevent admin from removing their own admin status
      if (user_id === ctx.state.user.user_id && is_admin === false) {
        return Response.json({
          error: "Cannot remove your own admin privileges",
        }, { status: 400 });
      }

      // Update user
      const updatedUser = {
        ...existingUser,
        is_admin: is_admin !== undefined ? is_admin : existingUser.is_admin,
        name: name || existingUser.name,
        email: email || existingUser.email,
        phone: phone !== undefined ? phone : existingUser.phone,
        updated_at: new Date().toISOString(),
      };

      // Save updated user
      await UserDB.kv.set(["users", user_id], updatedUser);

      // Update email index if email changed
      if (email && email !== existingUser.email) {
        // Remove old email index
        await UserDB.kv.delete(["users_by_email", existingUser.email]);
        // Add new email index
        await UserDB.kv.set(["users_by_email", email], user_id);
      }

      const { password_hash: _password_hash, ...safeUser } = updatedUser;

      return Response.json({
        success: true,
        user: safeUser,
      });
    } catch (error) {
      console.error("Failed to update user:", error);
      return Response.json({ error: "Failed to update user" }, { status: 500 });
    }
  },

  async DELETE(ctx) {
    // Check if user is admin
    if (!ctx.state.user?.is_admin) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    try {
      const url = new URL(ctx.req.url);
      const user_id = url.searchParams.get("user_id");

      if (!user_id) {
        return Response.json({ error: "User ID is required" }, { status: 400 });
      }

      // Prevent admin from deleting themselves
      if (user_id === ctx.state.user.user_id) {
        return Response.json({ error: "Cannot delete your own account" }, {
          status: 400,
        });
      }

      // Get user to delete
      const userToDelete = await UserDB.get(user_id);
      if (!userToDelete) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      // Delete user and email index
      await UserDB.kv.delete(["users", user_id]);
      await UserDB.kv.delete(["users_by_email", userToDelete.email]);

      // TODO: Also delete user's sessions and reports if needed
      // For now, we'll keep reports for data integrity

      return Response.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete user:", error);
      return Response.json({ error: "Failed to delete user" }, { status: 500 });
    }
  },
});
