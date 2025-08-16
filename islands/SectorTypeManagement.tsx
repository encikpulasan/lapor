import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import type { PollutionType, Sector } from "../lib/db.ts";

export default function SectorTypeManagement() {
  const pollutionTypes = useSignal<PollutionType[]>([]);
  const sectors = useSignal<Sector[]>([]);
  const loading = useSignal(true);
  const error = useSignal("");
  const activeTab = useSignal<"types" | "sectors">("types");

  // Form states for pollution types
  const newTypeName = useSignal("");
  const newTypeDescription = useSignal("");
  const editingType = useSignal<PollutionType | null>(null);
  const showTypeModal = useSignal(false);

  // Form states for sectors
  const newSectorName = useSignal("");
  const newSectorDescription = useSignal("");
  const editingSector = useSignal<Sector | null>(null);
  const showSectorModal = useSignal(false);

  const loadData = async () => {
    loading.value = true;
    error.value = "";

    try {
      const [typesResponse, sectorsResponse] = await Promise.all([
        fetch("/api/admin/pollution-types"),
        fetch("/api/admin/sectors"),
      ]);

      if (!typesResponse.ok || !sectorsResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const typesData = await typesResponse.json();
      const sectorsData = await sectorsResponse.json();

      pollutionTypes.value = typesData.data || [];
      sectors.value = sectorsData.data || [];
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
    } finally {
      loading.value = false;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Pollution Type Management Functions
  const openTypeModal = (type?: PollutionType) => {
    if (type) {
      editingType.value = type;
      newTypeName.value = type.name;
      newTypeDescription.value = type.description || "";
    } else {
      editingType.value = null;
      newTypeName.value = "";
      newTypeDescription.value = "";
    }
    showTypeModal.value = true;
  };

  const closeTypeModal = () => {
    showTypeModal.value = false;
    editingType.value = null;
    newTypeName.value = "";
    newTypeDescription.value = "";
  };

  const saveType = async (e: Event) => {
    e.preventDefault();

    if (!newTypeName.value.trim()) {
      error.value = "Type name is required";
      return;
    }

    try {
      const method = editingType.value ? "PUT" : "POST";
      const body = editingType.value
        ? {
          type_id: editingType.value.type_id,
          name: newTypeName.value.trim(),
          description: newTypeDescription.value.trim() || undefined,
        }
        : {
          name: newTypeName.value.trim(),
          description: newTypeDescription.value.trim() || undefined,
        };

      const response = await fetch("/api/admin/pollution-types", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save type");
      }

      await loadData();
      closeTypeModal();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
    }
  };

  const toggleTypeStatus = async (type: PollutionType) => {
    try {
      const response = await fetch("/api/admin/pollution-types", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type_id: type.type_id,
          is_active: !type.is_active,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update type");
      }

      await loadData();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
    }
  };

  const deleteType = async (typeId: string) => {
    if (!confirm("Are you sure you want to delete this pollution type?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/pollution-types?type_id=${typeId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete type");
      }

      await loadData();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
    }
  };

  // Sector Management Functions
  const openSectorModal = (sector?: Sector) => {
    if (sector) {
      editingSector.value = sector;
      newSectorName.value = sector.name;
      newSectorDescription.value = sector.description || "";
    } else {
      editingSector.value = null;
      newSectorName.value = "";
      newSectorDescription.value = "";
    }
    showSectorModal.value = true;
  };

  const closeSectorModal = () => {
    showSectorModal.value = false;
    editingSector.value = null;
    newSectorName.value = "";
    newSectorDescription.value = "";
  };

  const saveSector = async (e: Event) => {
    e.preventDefault();

    if (!newSectorName.value.trim()) {
      error.value = "Sector name is required";
      return;
    }

    try {
      const method = editingSector.value ? "PUT" : "POST";
      const body = editingSector.value
        ? {
          sector_id: editingSector.value.sector_id,
          name: newSectorName.value.trim(),
          description: newSectorDescription.value.trim() || undefined,
        }
        : {
          name: newSectorName.value.trim(),
          description: newSectorDescription.value.trim() || undefined,
        };

      const response = await fetch("/api/admin/sectors", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save sector");
      }

      await loadData();
      closeSectorModal();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
    }
  };

  const toggleSectorStatus = async (sector: Sector) => {
    try {
      const response = await fetch("/api/admin/sectors", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sector_id: sector.sector_id,
          is_active: !sector.is_active,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update sector");
      }

      await loadData();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
    }
  };

  const deleteSector = async (sectorId: string) => {
    if (!confirm("Are you sure you want to delete this sector?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/sectors?sector_id=${sectorId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete sector");
      }

      await loadData();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading.value) {
    return (
      <div class="flex items-center justify-center py-8">
        <div class="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      {error.value && (
        <div class="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error.value}
        </div>
      )}

      {/* Tab Navigation */}
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => activeTab.value = "types"}
            class={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab.value === "types"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            Pollution Types ({pollutionTypes.value.length})
          </button>
          <button
            type="button"
            onClick={() => activeTab.value = "sectors"}
            class={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab.value === "sectors"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            Sectors ({sectors.value.length})
          </button>
        </nav>
      </div>

      {/* Pollution Types Tab */}
      {activeTab.value === "types" && (
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Pollution Types Management
            </h3>
            <button
              type="button"
              onClick={() => openTypeModal()}
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md transition-colors shadow-sm hover:shadow-md"
            >
              Add New Type
            </button>
          </div>

          <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden transition-colors duration-200">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {pollutionTypes.value.map((type) => (
                    <tr
                      key={type.type_id}
                      class="hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">
                        {type.name}
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                        {type.description || "-"}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span
                          class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            type.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {type.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {formatDate(type.created_at)}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          type="button"
                          onClick={() => openTypeModal(type)}
                          class="px-3 py-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors shadow-sm hover:shadow-md"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleTypeStatus(type)}
                          class={`px-3 py-1 text-white text-sm font-medium rounded-md transition-colors shadow-sm hover:shadow-md ${
                            type.is_active
                              ? "bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600"
                              : "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                          }`}
                        >
                          {type.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteType(type.type_id)}
                          class="px-3 py-1 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white text-sm font-medium rounded-md transition-colors shadow-sm hover:shadow-md"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pollutionTypes.value.length === 0 && (
                <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                  No pollution types found. Click "Add New Type" to create one.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sectors Tab */}
      {activeTab.value === "sectors" && (
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Sectors Management
            </h3>
            <button
              type="button"
              onClick={() => openSectorModal()}
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md transition-colors shadow-sm hover:shadow-md"
            >
              Add New Sector
            </button>
          </div>

          <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden transition-colors duration-200">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sectors.value.map((sector) => (
                    <tr
                      key={sector.sector_id}
                      class="hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">
                        {sector.name}
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                        {sector.description || "-"}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span
                          class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            sector.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {sector.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {formatDate(sector.created_at)}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          type="button"
                          onClick={() => openSectorModal(sector)}
                          class="px-3 py-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors shadow-sm hover:shadow-md"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSectorStatus(sector)}
                          class={`px-3 py-1 text-white text-sm font-medium rounded-md transition-colors shadow-sm hover:shadow-md ${
                            sector.is_active
                              ? "bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600"
                              : "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                          }`}
                        >
                          {sector.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSector(sector.sector_id)}
                          class="px-3 py-1 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white text-sm font-medium rounded-md transition-colors shadow-sm hover:shadow-md"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {sectors.value.length === 0 && (
                <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                  No sectors found. Click "Add New Sector" to create one.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pollution Type Modal */}
      {showTypeModal.value && (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md transition-colors duration-200">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingType.value
                ? "Edit Pollution Type"
                : "Add New Pollution Type"}
            </h3>

            <form onSubmit={saveType} class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newTypeName.value}
                  onInput={(e) =>
                    newTypeName.value = (e.target as HTMLInputElement).value}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., Air Pollution"
                  required
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newTypeDescription.value}
                  onInput={(e) =>
                    newTypeDescription.value =
                      (e.target as HTMLTextAreaElement).value}
                  rows={3}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Optional description..."
                />
              </div>

              <div class="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeTypeModal}
                  class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-md transition-colors shadow-sm hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md transition-colors shadow-sm hover:shadow-md"
                >
                  {editingType.value ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sector Modal */}
      {showSectorModal.value && (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md transition-colors duration-200">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingSector.value ? "Edit Sector" : "Add New Sector"}
            </h3>

            <form onSubmit={saveSector} class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newSectorName.value}
                  onInput={(e) =>
                    newSectorName.value = (e.target as HTMLInputElement).value}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., Sector 1, Industrial Area"
                  required
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newSectorDescription.value}
                  onInput={(e) =>
                    newSectorDescription.value =
                      (e.target as HTMLTextAreaElement).value}
                  rows={3}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Optional description..."
                />
              </div>

              <div class="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeSectorModal}
                  class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-md transition-colors shadow-sm hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md transition-colors shadow-sm hover:shadow-md"
                >
                  {editingSector.value ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
