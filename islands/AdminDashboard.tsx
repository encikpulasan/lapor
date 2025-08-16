import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import type { PollutionReport, User } from "../lib/db.ts";

interface AdminDashboardProps {
  user: User;
}

export default function AdminDashboard({ user: _user }: AdminDashboardProps) {
  const reports = useSignal<PollutionReport[]>([]);
  const loading = useSignal(true);
  const error = useSignal("");
  const filterSector = useSignal("");
  const filterType = useSignal("");
  const filterUserId = useSignal("");

  // Load reports on component mount
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    loading.value = true;
    error.value = "";

    try {
      const params = new URLSearchParams();
      if (filterSector.value) params.append("sector", filterSector.value);
      if (filterUserId.value) params.append("user_id", filterUserId.value);

      const response = await fetch(`/api/reports?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        let filteredReports = result.reports;

        // Client-side filter by type if needed
        if (filterType.value) {
          filteredReports = filteredReports.filter(
            (report: PollutionReport) =>
              report.pollution_type === filterType.value,
          );
        }

        reports.value = filteredReports;
      } else {
        error.value = result.error || "Failed to load reports";
      }
    } catch (err) {
      console.error("Load reports error:", err);
      error.value = "Network error. Please try again.";
    } finally {
      loading.value = false;
    }
  };

  const exportReports = () => {
    const csvContent = [
      "Report ID,Timestamp,Pollution Type,Sector,IP Address,Location,Device ID,User ID,Status,Description",
      ...reports.value.map((report) =>
        [
          report.report_id,
          report.timestamp,
          report.pollution_type,
          report.sector,
          report.ip_address,
          report.location
            ? `"${report.location.city} (${report.location.lat}, ${report.location.lon})"`
            : "",
          report.device_id || "",
          report.user_id || "",
          report.status,
          `"${report.description || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = globalThis.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pollution-reports-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    globalThis.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "submitted":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading.value) {
    return (
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-8 transition-colors duration-200">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto">
          </div>
          <p class="mt-4 text-gray-500 dark:text-gray-400">
            Loading reports...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      {/* Statistics */}
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Total Reports
          </h3>
          <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {reports.value.length}
          </p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Pending
          </h3>
          <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {reports.value.filter((r) => r.status === "pending").length}
          </p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Submitted
          </h3>
          <p class="text-3xl font-bold text-green-600 dark:text-green-400">
            {reports.value.filter((r) => r.status === "submitted").length}
          </p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Failed
          </h3>
          <p class="text-3xl font-bold text-red-600 dark:text-red-400">
            {reports.value.filter((r) => r.status === "failed").length}
          </p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
        <div class="flex flex-wrap items-center gap-4 mb-4">
          <select
            value={filterSector.value}
            onInput={(e) => {
              filterSector.value = (e.target as HTMLSelectElement).value;
              loadReports();
            }}
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">All Sectors</option>
            <option value="1">Sector 1</option>
            <option value="2">Sector 2</option>
            <option value="3">Sector 3</option>
            <option value="4">Sector 4</option>
            <option value="5">Sector 5</option>
          </select>

          <select
            value={filterType.value}
            onInput={(e) => {
              filterType.value = (e.target as HTMLSelectElement).value;
              loadReports();
            }}
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">All Types</option>
            <option value="smell">Smell</option>
            <option value="smoke">Smoke</option>
            <option value="noise">Noise</option>
            <option value="water">Water</option>
            <option value="air">Air</option>
            <option value="waste">Waste</option>
            <option value="chemical">Chemical</option>
            <option value="other">Other</option>
          </select>

          <Button
            onClick={loadReports}
            class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Refresh
          </Button>

          <Button
            onClick={exportReports}
            class="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Export CSV
          </Button>
        </div>

        {error.value && (
          <div class="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4 transition-colors">
            {error.value}
          </div>
        )}
      </div>

      {/* Reports Table */}
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden transition-colors duration-200">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Pollution Reports
          </h3>
        </div>

        {reports.value.length === 0
          ? (
            <div class="p-8 text-center text-gray-500 dark:text-gray-400">
              No reports found matching the current filters.
            </div>
          )
          : (
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Report ID
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Sector
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Location
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {reports.value.map((report) => (
                    <tr
                      key={report.report_id}
                      class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-300">
                        {report.report_id.substring(0, 8)}...
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {formatDate(report.timestamp)}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        <span class="capitalize">{report.pollution_type}</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {report.sector}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {report.location ? report.location.city : "Unknown"}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span
                          class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            getStatusBadgeClass(report.status)
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {report.user_id ? "Registered" : "Anonymous"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
