import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import type { User } from "../lib/db.ts";

interface ReportFormProps {
  user?: User | null;
}

export default function ReportForm({ user }: ReportFormProps) {
  const pollutionType = useSignal("");
  const sector = useSignal("");
  const description = useSignal("");
  const isSubmitting = useSignal(false);
  const deviceId = useSignal("");
  const submitStatus = useSignal<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Device fingerprinting on component mount
  useEffect(() => {
    const generateDeviceId = () => {
      try {
        // Basic browser fingerprinting
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.textBaseline = "top";
          ctx.font = "14px Arial";
          ctx.fillText("Device fingerprint", 2, 2);
        }

        const fingerprint = {
          screen: screen.width + "x" + screen.height,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          platform: navigator.platform,
          canvas: canvas.toDataURL(),
          cookieEnabled: navigator.cookieEnabled,
          hardwareConcurrency: navigator.hardwareConcurrency || 0,
          timestamp: Date.now(),
        };

        const id = btoa(JSON.stringify(fingerprint)).substring(0, 32);
        deviceId.value = id;

        // Store in localStorage for consistency
        localStorage.setItem("deviceId", id);
      } catch (error) {
        console.warn("Device fingerprinting failed:", error);
        // Fallback to random ID
        deviceId.value = Math.random().toString(36).substring(2, 15);
      }
    };

    // Try to get existing device ID first
    const existingId = localStorage.getItem("deviceId");
    if (existingId) {
      deviceId.value = existingId;
    } else {
      generateDeviceId();
    }
  }, []);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (isSubmitting.value) return;

    if (!pollutionType.value || !sector.value) {
      submitStatus.value = {
        type: "error",
        message: "Please fill in all required fields",
      };
      return;
    }

    isSubmitting.value = true;
    submitStatus.value = { type: null, message: "" };

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pollution_type: pollutionType.value,
          sector: parseInt(sector.value),
          description: description.value,
          client_device_id: deviceId.value,
        }),
      });

      const result = await response.json();

      if (result.success) {
        submitStatus.value = {
          type: "success",
          message:
            `Report submitted successfully! Report ID: ${result.report_id}`,
        };

        // Reset form
        pollutionType.value = "";
        sector.value = "";
        description.value = "";
      } else {
        submitStatus.value = {
          type: "error",
          message: result.error || "Failed to submit report",
        };
      }
    } catch (error) {
      console.error("Submit error:", error);
      submitStatus.value = {
        type: "error",
        message: "Network error. Please try again.",
      };
    } finally {
      isSubmitting.value = false;
    }
  };

  return (
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Submit Pollution Report
      </h2>

      {submitStatus.value.type && (
        <div
          class={`p-4 rounded-md mb-6 transition-colors ${
            submitStatus.value.type === "success"
              ? "bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-500 text-green-700 dark:text-green-300"
              : "bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300"
          }`}
        >
          {submitStatus.value.message}
        </div>
      )}

      <form onSubmit={handleSubmit} class="space-y-6">
        {/* Pollution Type */}
        <div>
          <label
            htmlFor="pollution_type"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Type of Pollution *
          </label>
          <select
            id="pollution_type"
            value={pollutionType.value}
            onInput={(e) =>
              pollutionType.value = (e.target as HTMLSelectElement).value}
            class="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            required
          >
            <option value="">Select pollution type</option>
            <option value="smell">Bad Smell / Odor</option>
            <option value="smoke">Smoke</option>
            <option value="noise">Noise Pollution</option>
            <option value="water">Water Pollution</option>
            <option value="air">Air Pollution</option>
            <option value="waste">Waste / Litter</option>
            <option value="chemical">Chemical Pollution</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Sector */}
        <div>
          <label
            htmlFor="sector"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Area Sector *
          </label>
          <select
            id="sector"
            value={sector.value}
            onInput={(e) =>
              sector.value = (e.target as HTMLSelectElement).value}
            class="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            required
          >
            <option value="">Select your sector</option>
            <option value="1">Sector 1</option>
            <option value="2">Sector 2</option>
            <option value="3">Sector 3</option>
            <option value="4">Sector 4</option>
            <option value="5">Sector 5</option>
          </select>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Select the sector/area where the pollution is occurring
          </p>
        </div>

        {/* Description (Optional) */}
        <div>
          <label
            htmlFor="description"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description.value}
            onInput={(e) =>
              description.value = (e.target as HTMLTextAreaElement).value}
            rows={4}
            class="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Provide additional details about the pollution incident..."
          >
          </textarea>
        </div>

        {/* Info Box */}
        <div class="bg-gray-100 dark:bg-gray-700 rounded-md p-4 transition-colors">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Automatic Data Collection
          </h3>
          <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>
              • Your approximate location will be detected from your IP address
            </li>
            <li>
              • A device fingerprint will be generated for duplicate detection
            </li>
            <li>• Timestamp will be automatically recorded</li>
            {user && (
              <li>• Report will be linked to your account: {user.email}</li>
            )}
          </ul>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting.value}
          class={`w-full py-3 px-6 rounded-md font-medium text-white transition-colors duration-200 ${
            isSubmitting.value
              ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          }`}
        >
          {isSubmitting.value ? "Submitting..." : "Submit Report"}
        </Button>
      </form>
    </div>
  );
}
