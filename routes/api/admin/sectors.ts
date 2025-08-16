import { define } from "../../../utils.ts";
import { type Sector, SectorDB } from "../../../lib/db.ts";

export const handler = define.handlers({
  // GET /api/admin/sectors - Get all sectors
  async GET(ctx) {
    try {
      if (!ctx.state.user?.is_admin) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const sectors = await SectorDB.getAll();
      return Response.json({ success: true, data: sectors });
    } catch (error) {
      console.error("Error fetching sectors:", error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },

  // POST /api/admin/sectors - Create new sector
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

      const newSector = await SectorDB.create({
        name: name.trim(),
        description: description?.trim() || undefined,
        is_active: Boolean(is_active),
      });

      return Response.json({ success: true, data: newSector }, { status: 201 });
    } catch (error) {
      console.error("Error creating sector:", error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },

  // PUT /api/admin/sectors - Update sector
  async PUT(ctx) {
    try {
      if (!ctx.state.user?.is_admin) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await ctx.req.json();
      const { sector_id, name, description, is_active } = body;

      if (!sector_id || typeof sector_id !== "string") {
        return Response.json({ error: "Sector ID is required" }, {
          status: 400,
        });
      }

      const updates: Partial<Omit<Sector, "sector_id" | "created_at">> = {};

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

      const updatedSector = await SectorDB.update(sector_id, updates);

      if (!updatedSector) {
        return Response.json({ error: "Sector not found" }, { status: 404 });
      }

      return Response.json({ success: true, data: updatedSector });
    } catch (error) {
      console.error("Error updating sector:", error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },

  // DELETE /api/admin/sectors - Delete sector
  async DELETE(ctx) {
    try {
      if (!ctx.state.user?.is_admin) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const url = new URL(ctx.req.url);
      const sector_id = url.searchParams.get("sector_id");

      if (!sector_id) {
        return Response.json({ error: "Sector ID is required" }, {
          status: 400,
        });
      }

      const deleted = await SectorDB.delete(sector_id);

      if (!deleted) {
        return Response.json({ error: "Sector not found" }, { status: 404 });
      }

      return Response.json({
        success: true,
        message: "Sector deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting sector:", error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },
});
