import { define } from "../../../utils.ts";
import { type PollutionType, PollutionTypeDB } from "../../../lib/db.ts";

export const handler = define.handlers({
  // GET /api/admin/pollution-types - Get all pollution types
  async GET(ctx) {
    try {
      if (!ctx.state.user?.is_admin) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const types = await PollutionTypeDB.getAll();
      return Response.json({ success: true, data: types });
    } catch (error) {
      console.error("Error fetching pollution types:", error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },

  // POST /api/admin/pollution-types - Create new pollution type
  async POST(ctx) {
    try {
      if (!ctx.state.user?.is_admin) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await ctx.req.json();
      const { name, description, is_active = true } = body;

      if (!name || typeof name !== "string" || name.trim() === "") {
        return Response.json({ error: "Name is required" }, { status: 400 });
      }

      const newType = await PollutionTypeDB.create({
        name: name.trim(),
        description: description?.trim() || undefined,
        is_active: Boolean(is_active),
      });

      return Response.json({ success: true, data: newType }, { status: 201 });
    } catch (error) {
      console.error("Error creating pollution type:", error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },

  // PUT /api/admin/pollution-types - Update pollution type
  async PUT(ctx) {
    try {
      if (!ctx.state.user?.is_admin) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await ctx.req.json();
      const { type_id, name, description, is_active } = body;

      if (!type_id || typeof type_id !== "string") {
        return Response.json({ error: "Type ID is required" }, { status: 400 });
      }

      const updates: Partial<Omit<PollutionType, "type_id" | "created_at">> =
        {};

      if (name !== undefined) {
        if (typeof name !== "string" || name.trim() === "") {
          return Response.json({ error: "Name must be a non-empty string" }, {
            status: 400,
          });
        }
        updates.name = name.trim();
      }

      if (description !== undefined) {
        updates.description = description?.trim() || undefined;
      }

      if (is_active !== undefined) {
        updates.is_active = Boolean(is_active);
      }

      const updatedType = await PollutionTypeDB.update(type_id, updates);

      if (!updatedType) {
        return Response.json({ error: "Pollution type not found" }, {
          status: 404,
        });
      }

      return Response.json({ success: true, data: updatedType });
    } catch (error) {
      console.error("Error updating pollution type:", error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },

  // DELETE /api/admin/pollution-types - Delete pollution type
  async DELETE(ctx) {
    try {
      if (!ctx.state.user?.is_admin) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const url = new URL(ctx.req.url);
      const type_id = url.searchParams.get("type_id");

      if (!type_id) {
        return Response.json({ error: "Type ID is required" }, { status: 400 });
      }

      const deleted = await PollutionTypeDB.delete(type_id);

      if (!deleted) {
        return Response.json({ error: "Pollution type not found" }, {
          status: 404,
        });
      }

      return Response.json({
        success: true,
        message: "Pollution type deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting pollution type:", error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },
});
