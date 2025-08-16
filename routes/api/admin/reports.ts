import { define } from "../../../utils.ts";
import { ReportDB } from "../../../lib/db.ts";

export const handler = define.handlers({
  async PUT(ctx) {
    // Check if user is admin
    if (!ctx.state.user?.is_admin) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    try {
      const body = await ctx.req.json();
      const { report_id, status } = body;

      if (!report_id) {
        return Response.json({ error: "Report ID is required" }, {
          status: 400,
        });
      }

      if (
        !status ||
        !["pending", "submitted", "failed", "resolved"].includes(status)
      ) {
        return Response.json({
          error:
            "Valid status is required (pending, submitted, failed, resolved)",
        }, { status: 400 });
      }

      const validStatus = status as
        | "pending"
        | "submitted"
        | "failed"
        | "resolved";

      // Get existing report
      const existingReport = await ReportDB.get(report_id);
      if (!existingReport) {
        return Response.json({ error: "Report not found" }, { status: 404 });
      }

      // Update report status
      const updatedReport = {
        ...existingReport,
        status: validStatus,
        updated_at: new Date().toISOString(),
      };

      // Save updated report
      await ReportDB.kv.set(["reports", report_id], updatedReport);

      return Response.json({
        success: true,
        report: updatedReport,
      });
    } catch (error) {
      console.error("Failed to update report:", error);
      return Response.json({ error: "Failed to update report" }, {
        status: 500,
      });
    }
  },

  async DELETE(ctx) {
    // Check if user is admin
    if (!ctx.state.user?.is_admin) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    try {
      const url = new URL(ctx.req.url);
      const report_id = url.searchParams.get("report_id");

      if (!report_id) {
        return Response.json({ error: "Report ID is required" }, {
          status: 400,
        });
      }

      // Get report to delete
      const reportToDelete = await ReportDB.get(report_id);
      if (!reportToDelete) {
        return Response.json({ error: "Report not found" }, { status: 404 });
      }

      // Delete report
      await ReportDB.kv.delete(["reports", report_id]);

      return Response.json({
        success: true,
        message: "Report deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete report:", error);
      return Response.json({ error: "Failed to delete report" }, {
        status: 500,
      });
    }
  },
});
