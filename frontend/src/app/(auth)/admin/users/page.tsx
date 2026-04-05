"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useAppSelector } from "@/hooks/useAppSelector";
import { getAllUsersByProfileStatusController } from "@/controllers/admin/getAllUsersByProfileStatusController";
import { updateUserProfileStatusController } from "@/controllers/admin/updateUserProfileStatusController";
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  UserCog,
} from "lucide-react";
import { toast } from "react-hot-toast";

const STATUSES = ["ACTIVE", "SUSPENDED", "BANNED", "DEACTIVATED"] as const;
type ProfileStatus = (typeof STATUSES)[number];

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "BANNED", label: "Banned" },
  { value: "DEACTIVATED", label: "Deactivated" },
] as const;

interface UserRecord {
  userId: number;
  username: string;
  email: string;
  profileStatus: ProfileStatus;
}

interface PagedData {
  content: UserRecord[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100/60 text-green-700 dark:bg-green-900/20 dark:text-green-400";
    case "SUSPENDED":
      return "bg-amber-100/60 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
    case "BANNED":
      return "bg-red-100/60 text-red-700 dark:bg-red-900/20 dark:text-red-400";
    case "DEACTIVATED":
      return "bg-steel/10 text-steel dark:bg-sky/10 dark:text-sky";
    default:
      return "bg-steel/10 text-steel dark:bg-sky/10 dark:text-sky";
  }
}

export default function AdminUsersPage() {
  const router = useRouter();
  const accessToken = useAccessToken();
  const role = useAppSelector((state) => state.auth.role);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState<{
    userId: number;
    username: string;
    newStatus: ProfileStatus;
  } | null>(null);
  const [updating, setUpdating] = useState(false);

  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    const res = await getAllUsersByProfileStatusController(
      accessToken,
      debouncedSearch,
      statusFilter,
      page,
      20
    );
    if (res.success && res.data) {
      const paged = res.data as PagedData;
      setUsers(paged.content || []);
      setTotalPages(paged.totalPages || 0);
      setTotalElements(paged.totalElements || 0);
    } else {
      toast.error(res.message);
      setUsers([]);
      setTotalPages(0);
      setTotalElements(0);
    }
    setLoading(false);
  }, [accessToken, debouncedSearch, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!confirmAction || !accessToken) return;
    setUpdating(true);
    const res = await updateUserProfileStatusController(
      accessToken,
      confirmAction.userId,
      confirmAction.newStatus
    );
    if (res.success) {
      toast.success(res.message);
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === confirmAction.userId
            ? { ...u, profileStatus: confirmAction.newStatus }
            : u
        )
      );
    } else {
      toast.error(res.message);
    }
    setUpdating(false);
    setConfirmAction(null);
    setOpenDropdown(null);
  };

  // Access denied
  if (role !== "ADMIN") {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/40 mb-4">
            <ShieldAlert className="w-7 h-7 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-navy dark:text-cream mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-steel/60 dark:text-sky/40 mb-6">
            You need admin privileges to access this page.
          </p>
          <button
            onClick={() => router.push("/feed")}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-steel text-cream-50 dark:bg-sky dark:text-navy cursor-pointer"
          >
            Go to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-6 relative">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-steel/[0.04] dark:bg-steel/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-[10%] w-80 h-80 bg-sky/[0.05] dark:bg-sky/[0.02] rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-steel dark:text-sky hover:text-steel-600 dark:hover:text-sky/80 transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-steel to-sky shadow-sm shadow-steel/20 dark:shadow-sky/15">
            <UserCog className="w-5 h-5 text-cream-50" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy dark:text-cream">
              Manage Users
            </h1>
            <p className="text-xs text-steel/60 dark:text-sky/40">
              View and manage user accounts and profile statuses
            </p>
          </div>
          <span className="ml-auto px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            ADMIN ONLY
          </span>
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 mb-6">
        {/* Search bar */}
        <div className="p-4 rounded-2xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-steel/50 dark:text-sky/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-cream-300 dark:border-navy-700 bg-white dark:bg-navy-700/40 text-navy dark:text-cream text-sm placeholder:text-steel/40 dark:placeholder:text-sky/30 focus:outline-none focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel dark:focus:border-sky transition-all"
            />
          </div>
        </div>

        {/* Status filter buttons */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => {
            const isActive = statusFilter === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => {
                  setStatusFilter(filter.value);
                  setPage(0);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  isActive
                    ? "bg-steel/10 dark:bg-sky/10 border-steel/40 dark:border-sky/40 text-navy dark:text-cream shadow-sm"
                    : "bg-cream-100/40 dark:bg-navy-700/20 border-cream-300/40 dark:border-navy-700/40 text-steel/60 dark:text-sky/40 hover:border-steel/20 dark:hover:border-sky/20"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-xs text-steel/50 dark:text-sky/35 px-1">
            {totalElements} user{totalElements !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-7 h-7 text-steel dark:text-sky animate-spin mb-3" />
            <p className="text-sm text-steel/60 dark:text-sky/40">
              Loading users...
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cream-200/50 dark:bg-navy-700/40 mb-3">
              <Users className="w-6 h-6 text-steel/40 dark:text-sky/30" />
            </div>
            <p className="text-sm font-medium text-navy dark:text-cream mb-1">
              No users found
            </p>
            <p className="text-xs text-steel/50 dark:text-sky/35">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.userId}
              className="p-4 rounded-2xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40 flex items-center gap-4"
            >
              {/* Avatar */}
              <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-steel to-sky text-cream-50 font-bold text-sm uppercase">
                {user.username ? user.username.charAt(0) : "?"}
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy dark:text-cream truncate">
                  {user.username}
                </p>
                <p className="text-xs text-steel/60 dark:text-sky/40 truncate">
                  {user.email}
                </p>
              </div>

              {/* Status badge */}
              <span
                className={`flex-shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-full ${getStatusBadgeClasses(
                  user.profileStatus
                )}`}
              >
                {user.profileStatus}
              </span>

              {/* Status change dropdown */}
              <div className="relative flex-shrink-0" ref={openDropdown === user.userId ? dropdownRef : null}>
                <button
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === user.userId ? null : user.userId
                    )
                  }
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-cream-300/40 dark:border-navy-700/40 bg-cream-100/40 dark:bg-navy-700/20 hover:border-steel/30 dark:hover:border-sky/30 transition-all cursor-pointer"
                  title="Change status"
                >
                  <Shield className="w-4 h-4 text-steel/60 dark:text-sky/40" />
                </button>

                {openDropdown === user.userId && (
                  <div className="absolute right-0 top-full mt-1 z-20 w-40 py-1 rounded-xl bg-white dark:bg-navy-700 border border-cream-300/60 dark:border-navy-700/60 shadow-lg shadow-navy/5 dark:shadow-black/20">
                    {STATUSES.filter((s) => s !== user.profileStatus).map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setConfirmAction({
                              userId: user.userId,
                              username: user.username,
                              newStatus: status,
                            });
                            setOpenDropdown(null);
                          }}
                          className="w-full px-3 py-2 text-left text-xs font-medium text-navy dark:text-cream hover:bg-cream-200/50 dark:hover:bg-navy-600/40 transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              status === "ACTIVE"
                                ? "bg-green-500"
                                : status === "SUSPENDED"
                                ? "bg-amber-500"
                                : status === "BANNED"
                                ? "bg-red-500"
                                : "bg-steel/40 dark:bg-sky/40"
                            }`}
                          />
                          {status.charAt(0) + status.slice(1).toLowerCase()}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-cream-300/40 dark:border-navy-700/40 bg-cream-100/40 dark:bg-navy-700/20 hover:border-steel/30 dark:hover:border-sky/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 text-steel dark:text-sky" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i)
            .filter((i) => {
              // Show first, last, and pages around current
              if (i === 0 || i === totalPages - 1) return true;
              if (Math.abs(i - page) <= 1) return true;
              return false;
            })
            .reduce<(number | "ellipsis")[]>((acc, curr, idx, arr) => {
              if (idx > 0 && curr - (arr[idx - 1] as number) > 1) {
                acc.push("ellipsis");
              }
              acc.push(curr);
              return acc;
            }, [])
            .map((item, idx) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1 text-steel/40 dark:text-sky/30 text-sm"
                >
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item)}
                  className={`flex items-center justify-center w-9 h-9 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    page === item
                      ? "bg-steel/10 dark:bg-sky/10 border-steel/40 dark:border-sky/40 text-navy dark:text-cream"
                      : "border-cream-300/40 dark:border-navy-700/40 bg-cream-100/40 dark:bg-navy-700/20 text-steel/60 dark:text-sky/40 hover:border-steel/20 dark:hover:border-sky/20"
                  }`}
                >
                  {item + 1}
                </button>
              )
            )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-cream-300/40 dark:border-navy-700/40 bg-cream-100/40 dark:bg-navy-700/20 hover:border-steel/30 dark:hover:border-sky/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-steel dark:text-sky" />
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/30 dark:bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 p-6 rounded-2xl bg-white dark:bg-navy-700 border border-cream-300/60 dark:border-navy-600/60 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/40">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-base font-bold text-navy dark:text-cream">
                Confirm Status Change
              </h3>
            </div>

            <p className="text-sm text-steel/70 dark:text-sky/50 mb-6">
              Are you sure you want to change{" "}
              <span className="font-semibold text-navy dark:text-cream">
                {confirmAction.username}
              </span>
              &apos;s status to{" "}
              <span
                className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${getStatusBadgeClasses(
                  confirmAction.newStatus
                )}`}
              >
                {confirmAction.newStatus}
              </span>
              ?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={updating}
                className="flex-1 h-10 rounded-xl text-sm font-semibold border border-cream-300/60 dark:border-navy-600/60 text-steel dark:text-sky hover:bg-cream-100 dark:hover:bg-navy-600/40 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={updating}
                className="flex-1 h-10 rounded-xl text-sm font-semibold text-cream-50 bg-gradient-to-r from-steel to-steel-600 hover:from-steel-600 hover:to-steel dark:from-sky dark:to-sky/80 dark:hover:from-sky/90 dark:hover:to-sky dark:text-navy shadow-md shadow-steel/20 dark:shadow-sky/15 transition-all cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
