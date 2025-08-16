import type { PollutionReport } from "./db.ts";

// SISPAA integration service (placeholder for future implementation)
export class SISPAAService {
  private static readonly API_BASE_URL = Deno.env.get("SISPAA_API_URL") ||
    "https://api.sispaa.gov.my";
  private static readonly API_KEY = Deno.env.get("SISPAA_API_KEY");
  private static readonly TIMEOUT_MS = 30000; // 30 seconds

  // Submit report to SISPAA system
  static async submitReport(report: PollutionReport): Promise<{
    success: boolean;
    reference_id?: string;
    error?: string;
  }> {
    try {
      // Check if SISPAA integration is enabled
      if (!this.API_KEY) {
        console.log("SISPAA integration not configured - skipping submission");
        return {
          success: false,
          error: "SISPAA integration not configured",
        };
      }

      // Transform our report format to SISPAA format
      const sispaapayload = this.transformReportForSISPAA(report);

      // Simulate API call (replace with actual SISPAA API call)
      const response = await this.makeAPICall("/reports", sispaapayload);

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          reference_id: result.reference_id || result.id,
        };
      } else {
        const error = await response.text();
        console.error("SISPAA submission failed:", response.status, error);
        return {
          success: false,
          error: `SISPAA API error: ${response.status}`,
        };
      }
    } catch (error) {
      console.error("SISPAA submission error:", error);
      return {
        success: false,
        error: "Network error communicating with SISPAA",
      };
    }
  }

  // Transform our report format to SISPAA expected format
  private static transformReportForSISPAA(
    report: PollutionReport,
  ): Record<string, unknown> {
    return {
      // SISPAA expected fields (these are placeholder field names)
      report_type: "pollution",
      incident_type: this.mapPollutionTypeToSISPAA(report.pollution_type),
      location: {
        coordinates: report.location
          ? {
            latitude: report.location.lat,
            longitude: report.location.lon,
          }
          : null,
        area_code: report.sector.toString(),
        description: report.location?.city || "Unknown Location",
      },
      reporter: {
        type: report.user_id ? "registered" : "anonymous",
        ip_address: report.ip_address,
        device_fingerprint: report.device_id,
      },
      incident_details: {
        timestamp: report.timestamp,
        description: report.description ||
          `${report.pollution_type} pollution reported in sector ${report.sector}`,
        severity: "normal", // Could be enhanced to allow user input
      },
      source_system: {
        name: "Neighbourhood Pollution Reporting System",
        report_id: report.report_id,
      },
    };
  }

  // Map our pollution types to SISPAA categories
  private static mapPollutionTypeToSISPAA(pollutionType: string): string {
    const mapping: Record<string, string> = {
      smell: "odor_pollution",
      smoke: "air_pollution_smoke",
      noise: "noise_pollution",
      water: "water_pollution",
      air: "air_pollution",
      waste: "waste_management",
      chemical: "chemical_pollution",
      other: "environmental_other",
    };

    return mapping[pollutionType] || "environmental_other";
  }

  // Make API call with proper headers and timeout
  private static async makeAPICall(
    endpoint: string,
    data: Record<string, unknown>,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      return await fetch(`${this.API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.API_KEY}`,
          "User-Agent": "Lapor-Pollution-Reporter/1.0",
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Get submission status from SISPAA (for tracking)
  static async getSubmissionStatus(referenceId: string): Promise<{
    status: "pending" | "processing" | "completed" | "failed" | "unknown";
    details?: string;
  }> {
    try {
      if (!this.API_KEY) {
        return {
          status: "unknown",
          details: "SISPAA integration not configured",
        };
      }

      const response = await this.makeAPICall(
        `/reports/${referenceId}/status`,
        {},
      );

      if (response.ok) {
        const result = await response.json();
        return {
          status: result.status || "unknown",
          details: result.details,
        };
      } else {
        return {
          status: "unknown",
          details: "Failed to get status from SISPAA",
        };
      }
    } catch (error) {
      console.error("SISPAA status check error:", error);
      return { status: "unknown", details: "Error checking SISPAA status" };
    }
  }

  // Test SISPAA connectivity
  static async testConnection(): Promise<{
    success: boolean;
    message: string;
    latency?: number;
  }> {
    if (!this.API_KEY) {
      return {
        success: false,
        message: "SISPAA API key not configured",
      };
    }

    const startTime = Date.now();

    try {
      const response = await this.makeAPICall("/health", { test: true });
      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: "SISPAA connection successful",
          latency,
        };
      } else {
        return {
          success: false,
          message: `SISPAA connection failed: HTTP ${response.status}`,
          latency,
        };
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        success: false,
        message: `SISPAA connection error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        latency,
      };
    }
  }
}

// Background job to retry failed submissions
export class SISPAARetryService {
  private static retryIntervalId: number | null = null;

  // Start retry service
  static startRetryService(): void {
    if (this.retryIntervalId) {
      return; // Already running
    }

    console.log("Starting SISPAA retry service...");

    // Check every 5 minutes for failed submissions to retry
    this.retryIntervalId = setInterval(() => {
      this.processFailedSubmissions();
    }, 5 * 60 * 1000);
  }

  // Stop retry service
  static stopRetryService(): void {
    if (this.retryIntervalId) {
      clearInterval(this.retryIntervalId);
      this.retryIntervalId = null;
      console.log("SISPAA retry service stopped");
    }
  }

  // Process failed submissions (to be implemented with database queries)
  private static processFailedSubmissions(): Promise<void> {
    return Promise.resolve().then(() => {
      try {
        console.log("Checking for failed SISPAA submissions to retry...");

        // TODO: Query database for reports with status "failed" or "pending"
        // TODO: Attempt to resubmit them to SISPAA
        // TODO: Update their status based on the result

        // Placeholder for actual implementation
        console.log("No failed submissions to retry at this time");
      } catch (error) {
        console.error("Error processing failed SISPAA submissions:", error);
      }
    });
  }
}
