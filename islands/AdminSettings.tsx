import { useSignal } from "@preact/signals";
import { Button } from "../components/Button.tsx";

export default function AdminSettings() {
  const loading = useSignal(false);
  const message = useSignal("");
  const messageType = useSignal<"success" | "error" | "">("");

  // System statistics
  const _systemStats = useSignal({
    totalReports: 0,
    totalUsers: 0,
    pendingReports: 0,
    systemUptime: "N/A",
  });

  const showMessage = (msg: string, type: "success" | "error") => {
    message.value = msg;
    messageType.value = type;
    setTimeout(() => {
      message.value = "";
      messageType.value = "";
    }, 5000);
  };

  const clearAllData = () => {
    if (
      !confirm(
        "Are you sure you want to clear ALL data? This will delete all reports and users (except admins). This action CANNOT be undone!",
      )
    ) {
      return;
    }

    if (
      !confirm(
        "This is your final warning. ALL DATA WILL BE PERMANENTLY DELETED. Are you absolutely sure?",
      )
    ) {
      return;
    }

    loading.value = true;
    try {
      // Note: This would need a backend endpoint to implement safely
      showMessage(
        "Data clearing feature not implemented yet for safety reasons",
        "error",
      );
    } catch (_error) {
      showMessage("Failed to clear data", "error");
    } finally {
      loading.value = false;
    }
  };

  const exportAllData = () => {
    loading.value = true;
    try {
      // This would export all system data
      showMessage("Data export feature not implemented yet", "error");
    } catch (_error) {
      showMessage("Failed to export data", "error");
    } finally {
      loading.value = false;
    }
  };

  const testSISPAAConnection = () => {
    loading.value = true;
    try {
      // This would test the SISPAA API connection
      showMessage("SISPAA connection test not implemented yet", "error");
    } catch (_error) {
      showMessage("Failed to test SISPAA connection", "error");
    } finally {
      loading.value = false;
    }
  };

  return (
    <div class="space-y-6">
      {/* Message Display */}
      {message.value && (
        <div
          class={`p-4 rounded-md transition-colors ${
            messageType.value === "success"
              ? "bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-500 text-green-700 dark:text-green-300"
              : "bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300"
          }`}
        >
          {message.value}
        </div>
      )}

      {/* System Information */}
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            System Information
          </h3>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg transition-colors">
              <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Platform
              </div>
              <div class="text-lg font-semibold text-gray-900 dark:text-white">
                Fresh (Deno)
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg transition-colors">
              <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Database
              </div>
              <div class="text-lg font-semibold text-gray-900 dark:text-white">
                DenoKV
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg transition-colors">
              <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Version
              </div>
              <div class="text-lg font-semibold text-gray-900 dark:text-white">
                1.0.0
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg transition-colors">
              <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Environment
              </div>
              <div class="text-lg font-semibold text-gray-900 dark:text-white">
                Development
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SISPAA Integration */}
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            SISPAA Integration
          </h3>
        </div>
        <div class="p-6">
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            Configure and test the integration with Sistem Pengurusan Aduan Awam
            (SISPAA).
          </p>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SISPAA API Endpoint
              </label>
              <input
                type="url"
                placeholder="https://api.sispaa.gov.my/v1"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key
              </label>
              <input
                type="password"
                placeholder="Enter SISPAA API key"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div class="flex space-x-3">
              <Button
                onClick={testSISPAAConnection}
                disabled={loading.value}
                class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                {loading.value ? "Testing..." : "Test Connection"}
              </Button>
              <Button class="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors">
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Configuration */}
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Email Configuration
          </h3>
        </div>
        <div class="p-6">
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            Configure email settings for notifications and reports.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SMTP Server
              </label>
              <input
                type="text"
                placeholder="smtp.gmail.com"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Port
              </label>
              <input
                type="number"
                placeholder="587"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                type="email"
                placeholder="admin@lapor.local"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter email password"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div class="mt-4">
            <Button class="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors">
              Save Email Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Data Management
          </h3>
        </div>
        <div class="p-6">
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            Manage system data including backup, export, and cleanup operations.
          </p>

          <div class="space-y-4">
            <div class="flex flex-wrap gap-3">
              <Button
                onClick={exportAllData}
                disabled={loading.value}
                class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Export All Data
              </Button>

              <Button class="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors">
                Create Backup
              </Button>

              <Button class="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition-colors">
                Archive Old Reports
              </Button>
            </div>

            <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Danger Zone
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                These actions are irreversible. Please be very careful.
              </p>
              <Button
                onClick={clearAllData}
                disabled={loading.value}
                class="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Clear All Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* System Logs */}
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            System Logs
          </h3>
        </div>
        <div class="p-6">
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            View and manage system logs for debugging and monitoring.
          </p>

          <div class="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm max-h-64 overflow-y-auto">
            <div>[2024-01-01 10:00:00] INFO: Server started successfully</div>
            <div>[2024-01-01 10:00:01] INFO: Admin account initialized</div>
            <div>
              [2024-01-01 10:00:02] INFO: Database connection established
            </div>
            <div>
              [2024-01-01 10:05:00] INFO: New user registered: user@example.com
            </div>
            <div>
              [2024-01-01 10:10:00] INFO: New pollution report submitted
            </div>
            <div>[2024-01-01 10:15:00] INFO: Report forwarded to SISPAA</div>
            <div class="text-yellow-400">
              [2024-01-01 10:20:00] WARN: High number of reports from same IP
            </div>
            <div class="text-red-400">
              [2024-01-01 10:25:00] ERROR: SISPAA connection timeout
            </div>
          </div>

          <div class="mt-4 flex space-x-3">
            <Button class="bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors">
              Download Logs
            </Button>
            <Button class="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors">
              Clear Logs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
