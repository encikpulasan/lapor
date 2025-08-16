import { define } from "../../utils.ts";
import { PollutionTypeDB, SectorDB } from "../../lib/db.ts";

export const handler = define.handlers({
  // GET /api/form-data - Get active pollution types and sectors for forms
  async GET(_ctx) {
    try {
      const [types, sectors] = await Promise.all([
        PollutionTypeDB.getActive(),
        SectorDB.getActive(),
      ]);

      return Response.json({
        success: true,
        data: {
          pollution_types: types,
          sectors: sectors,
        },
      });
    } catch (error) {
      console.error("Error fetching form data:", error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },
});
