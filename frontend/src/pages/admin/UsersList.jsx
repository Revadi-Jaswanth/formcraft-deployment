import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  CheckCircle2,
  AlertOctagon,
  Trash2,
  ShieldCheck,
  ChevronRight,
  X,
  FileText,
  Clock,
} from "lucide-react";
import { adminApi } from "../../services/adminApi";
import toast from "react-hot-toast";

export default function UsersList() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Debouncing search
  useMemo(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Query users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users", debouncedSearch],
    queryFn: () => adminApi.getUsers({ search: debouncedSearch }).then((r) => r.data),
  });

  // Query single user details on click
  const { data: userDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["admin-user-details", selectedUser?.id],
    queryFn: () => adminApi.getUserDetails(selectedUser.id).then((r) => r.data),
    enabled: !!selectedUser,
  });

  // Mutations
  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, is_active }) => adminApi.updateUserStatus(userId, { is_active }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(data.data.message);
    },
    onError: () => {
      toast.error("Failed to update user status.");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => adminApi.deleteUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setShowDetailModal(false);
      setSelectedUser(null);
      toast.success("User account successfully removed.");
    },
    onError: () => {
      toast.error("Failed to delete user account.");
    },
  });

  const handleToggleStatus = (user) => {
    toggleStatusMutation.mutate({
      userId: user.id,
      is_active: !user.is_active,
    });
  };

  const handleDeleteUser = (user) => {
    if (
      confirm(
        `DANGER ZONE: Are you sure you want to permanently delete the account for "${user.name}"? All of their forms, templates, and responses will be permanently removed. This cannot be undone.`
      )
    ) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleOpenDetails = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
            User Management
          </h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            Monitor, suspend, or permanently remove platform users
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 text-xs py-2 w-full"
          />
        </div>
      </div>

      {/* Users table list */}
      <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/60 backdrop-blur-md">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
            <p className="text-xs text-slate-500 font-semibold animate-pulse">
              Fetching active users registry...
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-xs space-y-2">
            <Users className="w-8 h-8 text-slate-700 mx-auto" />
            <p className="font-bold">No users found</p>
            <p className="text-[10px]">Try adjusting your search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-850 text-slate-500 font-bold">
                  <th className="py-3">Full Name</th>
                  <th className="py-3">Email Address</th>
                  <th className="py-3">Role</th>
                  <th className="py-3">Created Forms</th>
                  <th className="py-3 text-center">Account Status</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-850/50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-850/10 group">
                    <td className="py-3 font-semibold text-slate-200">{user.name}</td>
                    <td className="py-3 text-slate-400 font-medium">{user.email}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          user.role?.toLowerCase() === "admin"
                            ? "bg-violet-500/10 text-violet-400"
                            : "bg-brand-500/10 text-brand-400"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-slate-300">
                      {user.forms_count} form(s)
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          title={user.is_active ? "Suspend Account" : "Activate Account"}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
                            user.is_active
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25"
                              : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/25"
                          }`}
                        >
                          {user.is_active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <AlertOctagon className="w-3 h-3" />
                              Suspended
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleOpenDetails(user)}
                          className="btn-secondary py-1 px-2.5 text-[10px] flex items-center gap-1"
                        >
                          Details
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/5 transition-all"
                          title="Delete User Permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Single user details detail drawer modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-6 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setShowDetailModal(false)}
              className="absolute right-4 top-4 p-1 text-slate-500 hover:text-slate-200 hover:bg-surface-850 rounded transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="font-bold text-slate-100 text-sm">Account Properties</h3>
              <p className="text-xs text-slate-500">
                Workspace configurations and templates owned by this user.
              </p>
            </div>

            {/* Profile cards stats segment */}
            <div className="p-4 rounded-xl bg-surface-950/50 border border-surface-850 space-y-3">
              <div className="flex items-center justify-between border-b border-surface-850/50 pb-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Name</span>
                <span className="text-xs font-semibold text-slate-200">{selectedUser.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-surface-850/50 pb-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Email</span>
                <span className="text-xs font-semibold text-slate-200">{selectedUser.email}</span>
              </div>
              <div className="flex items-center justify-between border-b border-surface-850/50 pb-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Role</span>
                <span className="text-xs font-semibold text-slate-200">{selectedUser.role}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Join Date</span>
                <span className="text-xs font-semibold text-slate-200">
                  {new Date(selectedUser.created_at).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Forms section */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-400" />
                Templates list ({userDetails?.forms?.length ?? 0})
              </h4>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {detailsLoading ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    Loading templates...
                  </div>
                ) : !userDetails?.forms || userDetails.forms.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    This user hasn't created any forms.
                  </div>
                ) : (
                  userDetails.forms.map((form) => (
                    <div
                      key={form.id}
                      className="p-3 rounded-lg border border-surface-850 bg-surface-950/30 flex justify-between items-center gap-4 hover:border-brand-500/20 transition-colors"
                    >
                      <div className="truncate">
                        <span className="text-xs font-semibold text-slate-200 block truncate">
                          {form.title}
                        </span>
                        <span className="text-[9px] text-slate-500 font-medium block mt-0.5">
                          Status: {form.status}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[9px] shrink-0">
                        {form.responses_count} response(s)
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => handleToggleStatus(selectedUser)}
                className={`btn-secondary py-2 px-4 ${
                  selectedUser.is_active ? "text-red-400 hover:text-red-300" : "text-emerald-400 hover:text-emerald-300"
                }`}
              >
                {selectedUser.is_active ? "Suspend User" : "Activate User"}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(selectedUser)}
                className="btn-primary py-2 px-4 bg-red-600 hover:bg-red-500 text-white"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
