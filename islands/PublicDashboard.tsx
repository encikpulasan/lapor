import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

interface DashboardData {
  summary: {
    total: number;
    today: number;
    thisMonth: number;
    pending: number;
  };
  monthly: { [date: string]: number };
  daily: {
    date: string;
    hourly: { [hour: string]: number };
  };
  types: { [type: string]: number };
  sectors: { [sector: string]: number };
  selectedDate: string;
}

export default function PublicDashboard() {
  const data = useSignal<DashboardData | null>(null);
  const loading = useSignal(true);
  const error = useSignal("");
  const selectedDate = useSignal(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-scroll to current date when data loads
  useEffect(() => {
    if (data.value) {
      // Find the current date in the grid and scroll to it
      setTimeout(() => {
        const currentDate = new Date().toISOString().split("T")[0];
        const currentDateElement = document.querySelector(
          `[data-date="${currentDate}"]`,
        );
        if (currentDateElement) {
          currentDateElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      }, 100); // Small delay to ensure DOM is ready
    }
  }, [data.value]);

  const loadDashboardData = async (date?: string) => {
    loading.value = true;
    error.value = "";

    try {
      const targetDate = date || selectedDate.value;
      const [year, month, day] = targetDate.split("-");

      const params = new URLSearchParams({
        year,
        month: month.replace(/^0/, ""), // Remove leading zero
        day: day.replace(/^0/, ""), // Remove leading zero
      });

      const response = await fetch(`/api/dashboard?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        data.value = result.data;
        selectedDate.value = result.data.selectedDate;
      } else {
        error.value = result.error || "Failed to load dashboard data";
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
      error.value = "Network error. Please try again.";
    } finally {
      loading.value = false;
    }
  };

  const handleDateSelect = (date: string) => {
    selectedDate.value = date;
    loadDashboardData(date);
  };

  const getContributionColor = (count: number) => {
    if (count === 0) return "bg-gray-200 dark:bg-gray-900";
    if (count <= 2) return "bg-green-300 dark:bg-green-800";
    if (count <= 5) return "bg-green-500 dark:bg-green-700";
    if (count <= 10) return "bg-green-600 dark:bg-green-600";
    return "bg-green-700 dark:bg-green-500";
  };

  const formatHour = (hour: string) => {
    const h = parseInt(hour);
    if (h === 0) return "12 AM";
    if (h < 12) return `${h} AM`;
    if (h === 12) return "12 PM";
    return `${h - 12} PM`;
  };

  const getMaxHourlyValue = () => {
    if (!data.value) return 1;
    return Math.max(...Object.values(data.value.daily.hourly), 1);
  };

  const renderMonthlyChart = () => {
    if (!data.value) return null;

    const currentYear = new Date().getFullYear();
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const weeks: Array<
      Array<{ date: string; count: number; day: number; month: number }>
    > = [];
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    // Calculate weeks for the year
    for (
      const d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 7)
    ) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(d);
        currentDate.setDate(d.getDate() + i);

        if (currentDate.getFullYear() === currentYear) {
          const dateStr = currentDate.toISOString().split("T")[0];
          const count = data.value.monthly[dateStr] || 0;
          week.push({
            date: dateStr,
            count,
            day: currentDate.getDate(),
            month: currentDate.getMonth(),
          });
        }
      }
      if (week.length > 0) {
        weeks.push(week);
      }
    }

    return (
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {currentYear} Report Activity
        </h3>

        {/* Month labels - grouped by month */}
        <div class="space-y-1 overflow-x-auto scrollbar-hide">
          {/* Month labels row */}
          <div class="flex space-x-1 min-w-max mb-3">
            {months.map((month, monthIndex) => {
              // Calculate how many weeks this month spans
              const monthWeeks = weeks.filter((week) => {
                const firstDay = week.find((day) => day);
                return firstDay && firstDay.month === monthIndex;
              }).length;

              if (monthWeeks === 0) return null;

              // Calculate width based on number of weeks
              // Both mobile and desktop now use 20px (w-5) + 4px spacing
              const width = monthWeeks * 20 + (monthWeeks - 1) * 4;

              return (
                <>
                  {/* Month label */}
                  <div
                    key={month}
                    class="flex items-center justify-center text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium"
                    style={{
                      width: `${width}px`,
                      minWidth: `${width}px`,
                    }}
                  >
                    <span class="hidden sm:inline">{month}</span>
                    <span class="sm:hidden">{month.substring(0, 3)}</span>
                  </div>
                </>
              );
            })}
          </div>

          {/* Contribution grid */}
          {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => (
            <div key={dayOfWeek} class="flex min-w-max">
              {weeks.map((week, weekIndex) => {
                const day = week[dayOfWeek];
                if (!day) {
                  return (
                    <div
                      key={weekIndex}
                      class="w-5 h-5 rounded"
                      style={{
                        marginRight: weekIndex < weeks.length - 1 ? "4px" : "0",
                      }}
                    >
                    </div>
                  );
                }

                return (
                  <button
                    type="button"
                    key={day.date}
                    data-date={day.date}
                    onClick={() => handleDateSelect(day.date)}
                    class={`w-5 h-5 rounded transition-all duration-200 hover:ring-2 hover:ring-blue-500 hover:ring-offset-1 ${
                      getContributionColor(day.count)
                    } ${
                      day.date === selectedDate.value
                        ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-800"
                        : ""
                    }`}
                    style={{
                      marginRight: weekIndex < weeks.length - 1 ? "4px" : "0",
                    }}
                    title={`${day.date}: ${day.count} reports`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div class="flex items-center justify-center mt-4 text-xs text-gray-500 dark:text-gray-400 space-x-3">
          <span>Less</span>
          <div class="flex space-x-1">
            <div class="w-4 h-4 sm:w-5 sm:h-5 bg-gray-200 dark:bg-gray-900 rounded">
            </div>
            <div class="w-4 h-4 sm:w-5 sm:h-5 bg-green-300 dark:bg-green-800 rounded">
            </div>
            <div class="w-4 h-4 sm:w-5 sm:h-5 bg-green-500 dark:bg-green-700 rounded">
            </div>
            <div class="w-4 h-4 sm:w-5 sm:h-5 bg-green-600 dark:bg-green-600 rounded">
            </div>
            <div class="w-4 h-4 sm:w-5 sm:h-5 bg-green-700 dark:bg-green-500 rounded">
            </div>
          </div>
          <span>More</span>
        </div>
      </div>
    );
  };

  const renderHourlyChart = () => {
    if (!data.value) return null;

    const maxValue = getMaxHourlyValue();
    const hours = Array.from(
      { length: 24 },
      (_, i) => i.toString().padStart(2, "0"),
    );

    return (
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Hourly Reports - {new Date(selectedDate.value).toLocaleDateString()}
        </h3>

        <div class="space-y-2">
          {hours.map((hour) => {
            const count = data.value!.daily.hourly[hour] || 0;
            const percentage = maxValue > 0 ? (count / maxValue) * 100 : 0;

            return (
              <div key={hour} class="flex items-center space-x-3">
                <div class="w-12 text-xs text-gray-500 dark:text-gray-400 text-right">
                  {formatHour(hour)}
                </div>
                <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
                  <div
                    class="bg-blue-500 dark:bg-blue-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div class="w-8 text-xs text-gray-700 dark:text-gray-300 text-right">
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTypeChart = () => {
    if (!data.value) return null;

    const types = [
      { key: "smell", label: "Smell", color: "bg-yellow-500" },
      { key: "smoke", label: "Smoke", color: "bg-gray-600" },
      { key: "noise", label: "Noise", color: "bg-purple-500" },
      { key: "water", label: "Water", color: "bg-blue-500" },
      { key: "air", label: "Air", color: "bg-cyan-500" },
      { key: "waste", label: "Waste", color: "bg-green-600" },
      { key: "chemical", label: "Chemical", color: "bg-red-500" },
      { key: "other", label: "Other", color: "bg-gray-400" },
    ];

    const totalTypes = Object.values(data.value.types).reduce(
      (sum, count) => sum + count,
      0,
    );

    return (
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Report Types
        </h3>

        <div class="space-y-3">
          {types.map((type) => {
            const count = data.value!.types[type.key] || 0;
            const percentage = totalTypes > 0 ? (count / totalTypes) * 100 : 0;

            return (
              <div key={type.key} class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class={`w-3 h-3 rounded-full ${type.color}`} />
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    {type.label}
                  </span>
                </div>
                <div class="flex items-center space-x-2">
                  <div class="w-24 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div
                      class={`h-2 rounded-full ${type.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSectorChart = () => {
    if (!data.value) return null;

    const sectors = [
      { key: "1", label: "Sector 1", color: "bg-blue-500" },
      { key: "2", label: "Sector 2", color: "bg-green-500" },
      { key: "3", label: "Sector 3", color: "bg-purple-500" },
      { key: "4", label: "Sector 4", color: "bg-orange-500" },
      { key: "5", label: "Sector 5", color: "bg-red-500" },
    ];

    const totalSectors = Object.values(data.value.sectors).reduce(
      (sum, count) => sum + count,
      0,
    );

    return (
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Affected Area
        </h3>

        <div class="space-y-3">
          {sectors.map((sector) => {
            const count = data.value!.sectors[sector.key] || 0;
            const percentage = totalSectors > 0
              ? (count / totalSectors) * 100
              : 0;

            return (
              <div key={sector.key} class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class={`w-3 h-3 rounded-full ${sector.color}`} />
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    {sector.label}
                  </span>
                </div>
                <div class="flex items-center space-x-2">
                  <div class="w-24 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div
                      class={`h-2 rounded-full ${sector.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading.value) {
    return (
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600">
        </div>
      </div>
    );
  }

  if (error.value) {
    return (
      <div class="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
        {error.value}
      </div>
    );
  }

  if (!data.value) {
    return (
      <div class="text-center py-12 text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <div class="space-y-8">
      <style>
        {`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      {/* Summary Statistics */}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200 text-center">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Total Reports
          </h3>
          <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {data.value.summary.total}
          </p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200 text-center">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Today
          </h3>
          <p class="text-3xl font-bold text-green-600 dark:text-green-400">
            {data.value.summary.today}
          </p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200 text-center">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            This Month
          </h3>
          <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {data.value.summary.thisMonth}
          </p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200 text-center">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            SISPAA
          </h3>
          <p class="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {data.value.summary.pending}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Monthly Contribution Chart */}
        <div class="lg:col-span-2">
          {renderMonthlyChart()}
        </div>

        {/* Left Column - Hourly Reports (Full Height) */}
        <div class="lg:row-span-2">
          {renderHourlyChart()}
        </div>

        {/* Right Column - Report Types and Affected Area */}
        <div class="space-y-6">
          {/* Report Types */}
          <div>
            {renderTypeChart()}
          </div>

          {/* Affected Area */}
          <div>
            {renderSectorChart()}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div class="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h4 class="text-sm font-medium text-blue-800 dark:text-blue-200">
              How to use this dashboard
            </h4>
            <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Click on any day in the yearly activity chart to view hourly
              reports for that specific day. The darker the green, the more
              reports were submitted that day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
