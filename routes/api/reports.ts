import { define } from "../../utils.ts";
import { type PollutionReport, ReportDB } from "../../lib/db.ts";
import { LocationService } from "../../lib/location.ts";
import { DeviceService } from "../../lib/device.ts";
import { AuthService } from "../../lib/auth.ts";

// Pollution types based on SRS requirements
const VALID_POLLUTION_TYPES = [
  "smell",
  "smoke",
  "noise",
  "water",
  "air",
  "waste",
  "chemical",
  "other",
];

// Sectors 1-5 as per SRS requirements
const VALID_SECTORS = [1, 2, 3, 4, 5];

export const handler = define.handlers({
  // Submit pollution report
  async POST(ctx) {
    try {
      const body = await ctx.req.json();
      const {
        pollution_type,
        sector,
        client_device_id,
        description,
      } = body;

      // Validation
      if (!pollution_type || !VALID_POLLUTION_TYPES.includes(pollution_type)) {
        return new Response(
          JSON.stringify({ error: "Invalid pollution type" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (!sector || !VALID_SECTORS.includes(parseInt(sector))) {
        return new Response(
          JSON.stringify({ error: "Invalid sector (must be 1-5)" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Get client IP and location
      const ip_address = LocationService.getClientIP(ctx.req);
      const location = await LocationService.getLocationWithFallback(
        ip_address,
      );

      // Generate device fingerprint
      const serverFingerprint = await DeviceService.generateDeviceFingerprint(
        ctx.req,
      );
      const device_id = DeviceService.combineFingerprints(
        serverFingerprint,
        client_device_id,
      );

      // Check for user session (optional for anonymous reporting)
      const sessionId = AuthService.getSessionFromCookies(ctx.req);
      let user_id = null;

      if (sessionId) {
        const user = await AuthService.getUserFromSession(sessionId);
        if (user) {
          user_id = user.user_id;
        }
      }

      // Create report
      const report = await ReportDB.create({
        timestamp: new Date().toISOString(),
        ip_address,
        location,
        device_id,
        pollution_type,
        sector: parseInt(sector),
        user_id,
        status: "pending",
        description: description || null,
      });

      // Forward to SISPAA system (asynchronously)
      try {
        const { SISPAAService } = await import("../../lib/sispaa.ts");
        SISPAAService.submitReport(report).then(async (result) => {
          if (result.success) {
            await ReportDB.update(report.report_id, {
              status: "submitted",
            });
            console.log(
              `Report ${report.report_id} submitted to SISPAA successfully`,
            );
          } else {
            await ReportDB.update(report.report_id, {
              status: "failed",
            });
            console.log(
              `Report ${report.report_id} failed to submit to SISPAA:`,
              result.error,
            );
          }
        }).catch(async (error) => {
          console.error("SISPAA submission error:", error);
          await ReportDB.update(report.report_id, {
            status: "failed",
          });
        });
      } catch (error) {
        console.error("Failed to load SISPAA service:", error);
      }

      return new Response(
        JSON.stringify({
          success: true,
          report_id: report.report_id,
          message: "Report submitted successfully",
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Report submission error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to submit report" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },

  // Get reports (admin only)
  async GET(ctx) {
    try {
      // Check authentication and admin status
      const sessionId = AuthService.getSessionFromCookies(ctx.req);
      if (!sessionId) {
        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      const user = await AuthService.getUserFromSession(sessionId);
      if (!user || !user.is_admin) {
        return new Response(
          JSON.stringify({ error: "Admin access required" }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }

      // Parse query parameters
      const url = new URL(ctx.req.url);
      const limit = parseInt(url.searchParams.get("limit") || "100");
      const offset = parseInt(url.searchParams.get("offset") || "0");
      const sector = url.searchParams.get("sector");
      const userId = url.searchParams.get("user_id");

      let reports: PollutionReport[];

      if (sector) {
        reports = await ReportDB.getBySector(parseInt(sector), limit);
      } else if (userId) {
        reports = await ReportDB.getByUser(userId, limit);
      } else {
        reports = await ReportDB.getAll(limit, offset);
      }

      return new Response(
        JSON.stringify({
          success: true,
          reports,
          count: reports.length,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Get reports error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch reports" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
});
