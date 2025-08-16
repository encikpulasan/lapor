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
      <div class="bg-white shadow rounded-lg p-8">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto">
          </div>
          <p class="mt-4 text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      {/* Statistics */}
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-medium text-gray-900">Total Reports</h3>
          <p class="text-3xl font-bold text-blue-600">{reports.value.length}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-medium text-gray-900">Pending</h3>
          <p class="text-3xl font-bold text-yellow-600">
            {reports.value.filter((r) => r.status === "pending").length}
          </p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-medium text-gray-900">Submitted</h3>
          <p class="text-3xl font-bold text-green-600">
            {reports.value.filter((r) => r.status === "submitted").length}
          </p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-medium text-gray-900">Failed</h3>
          <p class="text-3xl font-bold text-red-600">
            {reports.value.filter((r) => r.status === "failed").length}
          </p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex flex-wrap items-center gap-4 mb-4">
          <select
            value={filterSector.value}
            onInput={(e) => {
              filterSector.value = (e.target as HTMLSelectElement).value;
              loadReports();
            }}
            class="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
            class="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Refresh
          </Button>

          <Button
            onClick={exportReports}
            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            Export CSV
          </Button>
        </div>

        {error.value && (
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error.value}
          </div>
        )}
      </div>

      {/* Reports Table */}
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Pollution Reports</h3>
        </div>

        {reports.value.length === 0
          ? (
            <div class="p-8 text-center text-gray-500">
              No reports found matching the current filters.
            </div>
          )
          : (
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report ID
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sector
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {reports.value.map((report) => (
                    <tr key={report.report_id} class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {report.report_id.substring(0, 8)}...
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(report.timestamp)}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span class="capitalize">{report.pollution_type}</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.sector}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
