import { define } from "../../utils.ts";
import { ReportDB } from "../../lib/db.ts";

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

      // Calculate report type distribution
      const typeData: { [type: string]: number } = {};
      const typeLabels = [
        "smell",
        "smoke",
        "noise",
        "water",
        "air",
        "waste",
        "chemical",
        "other",
      ];

      // Initialize all types with 0
      typeLabels.forEach((type) => {
        typeData[type] = 0;
      });

      // Count reports by type
      allReports.forEach((report) => {
        const type = report.pollution_type || "other";
        typeData[type] = (typeData[type] || 0) + 1;
      });

      // Calculate sector distribution
      const sectorData: { [sector: string]: number } = {};
      for (let s = 1; s <= 5; s++) {
        sectorData[s.toString()] = 0;
      }

      allReports.forEach((report) => {
        const sector = report.sector?.toString() || "1";
        sectorData[sector] = (sectorData[sector] || 0) + 1;
      });

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
