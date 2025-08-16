import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import type {
  PollutionReport,
  PollutionType,
  Sector,
  User,
} from "../lib/db.ts";

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
  const editingReport = useSignal<PollutionReport | null>(null);
  const showEditModal = useSignal(false);

  // Dynamic data for filters and display
  const pollutionTypes = useSignal<PollutionType[]>([]);
  const sectors = useSignal<Sector[]>([]);
  const formDataLoading = useSignal(true);

  // Load reports on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        await loadFormData();
        await loadReports();
      } catch (err) {
        console.error("Initialization error:", err);
        error.value = "Failed to initialize dashboard";
        loading.value = false;
      }
    };

    initializeData();
  }, []);

  const loadFormData = async () => {
    try {
      console.log("Loading form data...");
      const response = await fetch("/api/form-data");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Form data response:", result);

      if (result.success) {
        pollutionTypes.value = result.data.pollution_types;
        sectors.value = result.data.sectors;
        console.log("Form data loaded successfully:", {
          types: pollutionTypes.value.length,
          sectors: sectors.value.length,
        });
      } else {
        throw new Error(result.error || "Failed to load form data");
      }
    } catch (err) {
      console.error("Load form data error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      error.value = `Failed to load form data: ${errorMessage}`;
      throw err; // Re-throw to be caught by the caller
    } finally {
      formDataLoading.value = false;
    }
  };

  const loadReports = async () => {
    loading.value = true;
    error.value = "";

    try {
      console.log("Loading reports...");
      const params = new URLSearchParams();
      if (filterSector.value) params.append("sector", filterSector.value);
      if (filterUserId.value) params.append("user_id", filterUserId.value);

      const response = await fetch(`/api/reports?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Reports response:", result);

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
        console.log("Reports loaded successfully:", filteredReports.length);
      } else {
        throw new Error(result.error || "Failed to load reports");
      }
    } catch (err) {
      console.error("Load reports error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      error.value = `Failed to load reports: ${errorMessage}`;
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
          getPollutionTypeDisplayName(report.pollution_type),
          getSectorDisplayName(report.sector),
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

  const getPollutionTypeDisplayName = (typeSlug: string) => {
    const type = pollutionTypes.value.find((t) =>
      t.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") ===
        typeSlug
    );
    return type ? type.name : typeSlug;
  };

  const getSectorDisplayName = (sectorIndex: number) => {
    const sector = sectors.value[sectorIndex - 1];
    return sector ? sector.name : `Sector ${sectorIndex}`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "submitted":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "resolved":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const openEditModal = (report: PollutionReport) => {
    editingReport.value = { ...report };
    showEditModal.value = true;
  };

  const closeEditModal = () => {
    editingReport.value = null;
    showEditModal.value = false;
  };

  const updateReportStatus = async (e: Event) => {
    e.preventDefault();
    if (!editingReport.value) return;

    try {
      const response = await fetch("/api/admin/reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_id: editingReport.value.report_id,
          status: editingReport.value.status,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update reports list
        reports.value = reports.value.map((r) =>
          r.report_id === editingReport.value?.report_id ? result.report : r
        );
        closeEditModal();
      } else {
        error.value = result.error || "Failed to update report";
      }
    } catch (err) {
      console.error("Update report error:", err);
      error.value = "Network error. Please try again.";
    }
  };

  const deleteReport = async (reportId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this report? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/reports?report_id=${reportId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        // Remove report from list
        reports.value = reports.value.filter((r) => r.report_id !== reportId);
      } else {
        error.value = result.error || "Failed to delete report";
      }
    } catch (err) {
      console.error("Delete report error:", err);
      error.value = "Network error. Please try again.";
    }
  };

  if (loading.value && !error.value) {
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
            Resolved
          </h3>
          <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {reports.value.filter((r) => r.status === "resolved").length}
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
            disabled={formDataLoading.value}
          >
            <option value="">All Sectors</option>
            {sectors.value.map((sector) => (
              <option
                key={sector.sector_id}
                value={sectors.value.indexOf(sector) + 1}
              >
                {sector.name}
              </option>
            ))}
          </select>

          <select
            value={filterType.value}
            onInput={(e) => {
              filterType.value = (e.target as HTMLSelectElement).value;
              loadReports();
            }}
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
            disabled={formDataLoading.value}
          >
            <option value="">All Types</option>
            {pollutionTypes.value.map((type) => (
              <option
                key={type.type_id}
                value={type.name.toLowerCase().replace(/\s+/g, "_").replace(
                  /[^a-z0-9_]/g,
                  "",
                )}
              >
                {type.name}
              </option>
            ))}
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
            <div class="flex items-center justify-between">
              <span>{error.value}</span>
              <button
                type="button"
                onClick={() => {
                  error.value = "";
                  loading.value = true;
                  const initializeData = async () => {
                    try {
                      await loadFormData();
                      await loadReports();
                    } catch (err) {
                      console.error("Retry initialization error:", err);
                      error.value = "Failed to initialize dashboard";
                      loading.value = false;
                    }
                  };
                  initializeData();
                }}
                class="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Retry
              </button>
            </div>
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
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {reports.value.map((report) => (
                    <tr
                      key={report.report_id}
                      class="hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-300">
                        {report.report_id.substring(0, 8)}...
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {formatDate(report.timestamp)}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        <span class="capitalize">
                          {getPollutionTypeDisplayName(report.pollution_type)}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {getSectorDisplayName(report.sector)}
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
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(report)}
                          class="px-3 py-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors shadow-sm hover:shadow-md"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteReport(report.report_id)}
                          class="px-3 py-1 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white text-sm font-medium rounded-md transition-colors shadow-sm hover:shadow-md"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* Edit Report Modal */}
      {showEditModal.value && editingReport.value && (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md transition-colors duration-200">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Update Report Status
            </h3>

            <form onSubmit={updateReportStatus} class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Report ID
                </label>
                <input
                  type="text"
                  value={editingReport.value.report_id.substring(0, 8) + "..."}
                  disabled
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-300 rounded-md"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pollution Type
                </label>
                <input
                  type="text"
                  value={editingReport.value.pollution_type}
                  disabled
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-300 rounded-md capitalize"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={editingReport.value.status}
                  onChange={(e) => {
                    if (editingReport.value) {
                      editingReport.value = {
                        ...editingReport.value,
                        status: (e.target as HTMLSelectElement).value as
                          | "pending"
                          | "submitted"
                          | "failed"
                          | "resolved",
                      };
                    }
                  }}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted to SISPAA</option>
                  <option value="failed">Failed</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div class="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-md transition-colors shadow-sm hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md transition-colors shadow-sm hover:shadow-md"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
