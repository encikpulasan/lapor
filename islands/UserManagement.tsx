import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import type { User } from "../lib/db.ts";

interface UserManagementProps {
  currentUser: User;
}

export default function UserManagement({ currentUser }: UserManagementProps) {
  const users = useSignal<User[]>([]);
  const loading = useSignal(true);
  const error = useSignal("");
  const editingUser = useSignal<User | null>(null);
  const showEditModal = useSignal(false);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/api/admin/users");
      const result = await response.json();

      if (result.success) {
        users.value = result.users;
      } else {
        error.value = result.error || "Failed to load users";
      }
    } catch (err) {
      console.error("Load users error:", err);
      error.value = "Network error. Please try again.";
    } finally {
      loading.value = false;
    }
  };

  const openEditModal = (user: User) => {
    editingUser.value = { ...user };
    showEditModal.value = true;
  };

  const closeEditModal = () => {
    editingUser.value = null;
    showEditModal.value = false;
  };

  const updateUser = async (e: Event) => {
    e.preventDefault();
    if (!editingUser.value) return;

    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUser.value),
      });

      const result = await response.json();

      if (result.success) {
        // Update users list
        users.value = users.value.map((u) =>
          u.user_id === editingUser.value?.user_id ? result.user : u
        );
        closeEditModal();
      } else {
        error.value = result.error || "Failed to update user";
      }
    } catch (err) {
      console.error("Update user error:", err);
      error.value = "Network error. Please try again.";
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete user "${userName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?user_id=${userId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        // Remove user from list
        users.value = users.value.filter((u) => u.user_id !== userId);
      } else {
        error.value = result.error || "Failed to delete user";
      }
    } catch (err) {
      console.error("Delete user error:", err);
      error.value = "Network error. Please try again.";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading.value) {
    return (
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-8 transition-colors duration-200">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto">
          </div>
          <p class="mt-4 text-gray-500 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      {/* Statistics */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Total Users
          </h3>
          <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {users.value.length}
          </p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Admins
          </h3>
          <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {users.value.filter((u) => u.is_admin).length}
          </p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-200">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Regular Users
          </h3>
          <p class="text-3xl font-bold text-green-600 dark:text-green-400">
            {users.value.filter((u) => !u.is_admin).length}
          </p>
        </div>
      </div>

      {error.value && (
        <div class="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded transition-colors">
          {error.value}
        </div>
      )}

      {/* Users Table */}
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden transition-colors duration-200">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            User Accounts
          </h3>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
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
              {users.value.map((user) => (
                <tr
                  key={user.user_id}
                  class="hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900 dark:text-gray-300">
                      {user.name}
                    </div>
                    {user.phone && (
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        {user.phone}
                      </div>
                    )}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {user.email}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_admin
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {user.is_admin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {formatDate(user.created_at)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(user)}
                      class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      Edit
                    </button>
                    {user.user_id !== currentUser.user_id && (
                      <button
                        type="button"
                        onClick={() => deleteUser(user.user_id, user.name)}
                        class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal.value && editingUser.value && (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md transition-colors duration-200">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Edit User
            </h3>

            <form onSubmit={updateUser} class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editingUser.value.name}
                  onInput={(e) => {
                    if (editingUser.value) {
                      editingUser.value = {
                        ...editingUser.value,
                        name: (e.target as HTMLInputElement).value,
                      };
                    }
                  }}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editingUser.value.email}
                  onInput={(e) => {
                    if (editingUser.value) {
                      editingUser.value = {
                        ...editingUser.value,
                        email: (e.target as HTMLInputElement).value,
                      };
                    }
                  }}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editingUser.value.phone || ""}
                  onInput={(e) => {
                    if (editingUser.value) {
                      editingUser.value = {
                        ...editingUser.value,
                        phone: (e.target as HTMLInputElement).value,
                      };
                    }
                  }}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingUser.value.is_admin}
                    onChange={(e) => {
                      if (editingUser.value) {
                        editingUser.value = {
                          ...editingUser.value,
                          is_admin: (e.target as HTMLInputElement).checked,
                        };
                      }
                    }}
                    disabled={editingUser.value.user_id === currentUser.user_id}
                    class="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Administrator{" "}
                    {editingUser.value.user_id === currentUser.user_id &&
                      "(Cannot change your own role)"}
                  </span>
                </label>
              </div>

              <div class="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={closeEditModal}
                  class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-md transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md transition-colors"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
