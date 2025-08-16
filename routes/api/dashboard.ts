import { define } from "../../utils.ts";
import { PollutionTypeDB, ReportDB, SectorDB } from "../../lib/db.ts";

export const handler = define.handlers({
  async GET(ctx) {
    try {
      const url = new URL(ctx.req.url);
      const year = url.searchParams.get("year") ||
        new Date().getFullYear().toString();
      const month = url.searchParams.get("month") ||
        (new Date().getMonth() + 1).toString();
      const day = url.searchParams.get("day") ||
        new Date().getDate().toString();

      // Get all reports for calculations
      const allReports = await ReportDB.getAll(10000); // Get a large number to ensure we get all

      // Helper function to get date string in YYYY-MM-DD format
      const getDateString = (date: Date) => {
        return date.toISOString().split("T")[0];
      };

      // Helper function to parse timestamp to Date
      const parseTimestamp = (timestamp: string) => {
        return new Date(timestamp);
      };

      // Calculate monthly contribution data (GitHub-style)
      const monthlyData: { [date: string]: number } = {};
      const currentYear = parseInt(year);

      // Initialize all days of the year with 0
      for (let m = 1; m <= 12; m++) {
        const daysInMonth = new Date(currentYear, m, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${currentYear}-${m.toString().padStart(2, "0")}-${
            d.toString().padStart(2, "0")
          }`;
          monthlyData[dateStr] = 0;
        }
      }

      // Count reports by date
      allReports.forEach((report) => {
        const reportDate = parseTimestamp(report.timestamp);
        if (reportDate.getFullYear() === currentYear) {
          const dateStr = getDateString(reportDate);
          monthlyData[dateStr] = (monthlyData[dateStr] || 0) + 1;
        }
      });

      // Calculate daily hourly data for selected day
      const selectedDate = `${year}-${month.padStart(2, "0")}-${
        day.padStart(2, "0")
      }`;
      const hourlyData: { [hour: string]: number } = {};

      // Initialize all hours with 0
      for (let h = 0; h < 24; h++) {
        hourlyData[h.toString().padStart(2, "0")] = 0;
      }

      // Count reports by hour for selected day
      allReports.forEach((report) => {
        const reportDate = parseTimestamp(report.timestamp);
        const reportDateStr = getDateString(reportDate);

        if (reportDateStr === selectedDate) {
          const hour = reportDate.getHours().toString().padStart(2, "0");
          hourlyData[hour] = (hourlyData[hour] || 0) + 1;
        }
      });

      // Get dynamic pollution types and sectors
      const [pollutionTypes, sectors] = await Promise.all([
        PollutionTypeDB.getActive(),
        SectorDB.getActive(),
      ]);

      // Debug logging
      console.log(
        "Dashboard API - Active pollution types:",
        pollutionTypes.map((t) => t.name),
      );
      console.log(
        "Dashboard API - Active sectors:",
        sectors.map((s) => s.name),
      );
      console.log("Dashboard API - Total reports:", allReports.length);

      // Calculate report type distribution
      const typeData: { [type: string]: number } = {};

      // Initialize all types with 0
      pollutionTypes.forEach((type) => {
        typeData[type.name] = 0;
      });

      // Create a comprehensive mapping for legacy data
      const legacyTypeMapping: { [key: string]: string } = {
        "smell": "Bad Smell / Odor",
        "smoke": "Smoke",
        "noise": "Noise Pollution",
        "water": "Water Pollution",
        "air": "Air Pollution",
        "waste": "Waste / Litter",
        "chemical": "Chemical Pollution",
        "other": "Other",
      };

      // Count reports by type
      allReports.forEach((report) => {
        const reportType = report.pollution_type || "other";

        // Try to find the type in our dynamic types first
        let finalTypeName = pollutionTypes.find((t) =>
          t.name.toLowerCase().replace(/\s+/g, "_").replace(
            /[^a-z0-9_]/g,
            "",
          ) === reportType
        )?.name;

        // If not found, try legacy mapping
        if (!finalTypeName) {
          finalTypeName = legacyTypeMapping[reportType];
        }

        // If still not found, use the original type
        if (!finalTypeName) {
          finalTypeName = reportType;
        }

        // Add to the appropriate category
        if (typeData[finalTypeName] !== undefined) {
          typeData[finalTypeName]++;
        } else {
          // If the type doesn't exist in our current types, add it to "Other"
          if (typeData["Other"] !== undefined) {
            typeData["Other"]++;
          }
        }
      });

      console.log("Dashboard API - Final type data:", typeData);

      // Calculate sector distribution
      const sectorData: { [sector: string]: number } = {};

      // Initialize all sectors with 0
      sectors.forEach((sector) => {
        sectorData[sector.name] = 0;
      });

      // Create a mapping for legacy sector data
      const legacySectorMapping: { [key: number]: string } = {
        1: "Sector 1",
        2: "Sector 2",
        3: "Sector 3",
        4: "Sector 4",
        5: "Sector 5",
      };

      allReports.forEach((report) => {
        const sectorIndex = report.sector || 1;

        // Try to find the sector in our dynamic sectors first
        let sectorName = sectors[sectorIndex - 1]?.name;

        // If not found, try legacy mapping
        if (!sectorName) {
          sectorName = legacySectorMapping[sectorIndex];
        }

        // If still not found, create a generic name
        if (!sectorName) {
          sectorName = `Sector ${sectorIndex}`;
        }

        // Add to the appropriate category
        if (sectorData[sectorName] !== undefined) {
          sectorData[sectorName]++;
        } else {
          // If the sector doesn't exist in our current sectors, add it to the first available
          const firstSector = sectors[0]?.name || "Sector 1";
          if (sectorData[firstSector] !== undefined) {
            sectorData[firstSector]++;
          }
        }
      });

      console.log("Dashboard API - Final sector data:", sectorData);

      // Calculate summary statistics
      const today = new Date();
      const todayStr = getDateString(today);
      const thisMonth = `${today.getFullYear()}-${
        (today.getMonth() + 1).toString().padStart(2, "0")
      }`;

      const todayReports = monthlyData[todayStr] || 0;
      const thisMonthReports = Object.keys(monthlyData)
        .filter((date) => date.startsWith(thisMonth))
        .reduce((sum, date) => sum + monthlyData[date], 0);

      const totalReports = allReports.length;
      const pendingReports = allReports.filter((r) =>
        r.status === "pending"
      ).length;

      return Response.json({
        success: true,
        data: {
          summary: {
            total: totalReports,
            today: todayReports,
            thisMonth: thisMonthReports,
            pending: pendingReports,
          },
          monthly: monthlyData,
          daily: {
            date: selectedDate,
            hourly: hourlyData,
          },
          types: typeData,
          sectors: sectorData,
          selectedDate: selectedDate,
        },
      });
    } catch (error) {
      console.error("Dashboard API error:", error);
      return Response.json({
        success: false,
        error: "Failed to fetch dashboard data",
      }, { status: 500 });
    }
  },
});
