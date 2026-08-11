import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users,
  FileText,
  MessageSquare,
  TrendingUp,
  Activity,
  UserPlus,
  ArrowUpRight,
  Database,
  Search,
} from "lucide-react";
import { adminApi } from "../../services/adminApi";
import SkeletonCard from "../../components/dashboard/SkeletonCard";

// Mini SVG Line Chart for dashboard stats
function AdminMiniChart({ data = [], colorClass = "text-brand-500", fillId = "brand-grad" }) {
  if (data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const points = data
    .map((d, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 90 - (d.count / maxVal) * 70; // Map range to leave padding
      return `${x},${y}`;
    })
    .join(" ");

  const pathD = `M 0,100 L ${points} L 100,100 Z`;

  return (
    <div className="w-full h-24 mt-4 relative">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={`w-full h-full ${colorClass}`}>
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Fill Area */}
        <path d={pathD} fill={`url(#${fillId})`} />
        {/* Stroke Line */}
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
      {/* Date Labels */}
      <div className="flex justify-between text-[9px] text-slate-500 font-semibold mt-1 px-1">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.getStats().then((r) => r.data),
  });

  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: () => adminApi.getAuditLogs().then((r) => r.data),
  });

  const isPageLoading = statsLoading || logsLoading;

  if (isPageLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-surface-900 rounded animate-pulse"></div>
        <SkeletonCard type="stats" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonCard type="table" />
          </div>
          <div>
            <SkeletonCard type="table" />
          </div>
        </div>
      </div>
    );
  }

  const summary = stats?.summary ?? {};
  const charts = stats?.charts ?? {};
  const activeForms = stats?.most_active_forms ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
          Admin Dashboard
        </h2>
        <p className="text-slate-500 text-xs mt-0.5 font-medium">
          Global platform stats, user management audits, and response metrics
        </p>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Users */}
        <div className="p-5 rounded-2xl border border-surface-850 bg-surface-900/60 backdrop-blur-md flex flex-col justify-between hover:border-brand-500/30 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Total Active Users
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-100 tracking-tight block">
              {summary.active_users}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block mt-1">
              Out of {summary.total_users} total registrations
            </span>
          </div>
        </div>

        {/* Card 2: Forms */}
        <div className="p-5 rounded-2xl border border-surface-850 bg-surface-900/60 backdrop-blur-md flex flex-col justify-between hover:border-violet-500/30 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Published Forms
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-100 tracking-tight block">
              {summary.published_forms}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block mt-1">
              Draft: {summary.draft_forms} | Archived: {summary.archived_forms}
            </span>
          </div>
        </div>

        {/* Card 3: Responses */}
        <div className="p-5 rounded-2xl border border-surface-850 bg-surface-900/60 backdrop-blur-md flex flex-col justify-between hover:border-emerald-500/30 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Today's Submissions
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-100 tracking-tight block">
              {summary.today_responses}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block mt-1">
              Total lifetime responses: {summary.total_responses}
            </span>
          </div>
        </div>

        {/* Card 4: Database Storage */}
        <div className="p-5 rounded-2xl border border-surface-850 bg-surface-900/60 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/30 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Est. Storage Usage
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-100 tracking-tight block">
              {summary.storage_usage_mb} MB
            </span>
            <span className="text-[10px] text-slate-500 font-medium block mt-1">
              Optimized PostgreSQL tables
            </span>
          </div>
        </div>
      </div>

      {/* Main Activity layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Table: Most Active Forms */}
          <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-brand-400" />
                <h3 className="font-bold text-slate-100 text-sm">Most Active Platform Forms</h3>
              </div>
              <Link
                to="/admin/forms"
                className="text-xs text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1"
              >
                View all forms
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-850 text-slate-500 font-bold">
                    <th className="py-2.5">Form Title</th>
                    <th className="py-2.5">Total Responses</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-850/50">
                  {activeForms.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-8 text-center text-slate-500">
                        No submissions recorded on the platform yet.
                      </td>
                    </tr>
                  ) : (
                    activeForms.map((form) => (
                      <tr key={form.id} className="hover:bg-surface-850/10">
                        <td className="py-3 font-semibold text-slate-200">{form.title}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
                            {form.responses_count} response(s)
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            to={`/admin/responses?search=${encodeURIComponent(form.title)}`}
                            className="text-brand-400 hover:underline font-bold"
                          >
                            Inspect submissions
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Timeline Audits */}
        <div>
          <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/40 space-y-4 h-full flex flex-col">
            <div className="flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-brand-400" />
              <h3 className="font-bold text-slate-100 text-sm">Platform Audit Trail</h3>
            </div>
            <p className="text-slate-500 text-[10px] font-semibold leading-relaxed uppercase tracking-wider shrink-0">
              Live registrations, form creation & response submissions
            </p>

            <div className="flex-1 overflow-y-auto space-y-4 mt-2 pr-1 max-h-[360px] lg:max-h-none">
              {auditLogs?.length === 0 ? (
                <div className="text-center text-slate-500 py-12 text-xs">
                  No activity recorded yet.
                </div>
              ) : (
                auditLogs?.map((log, index) => {
                  let typeColor = "bg-brand-500/10 text-brand-400";
                  if (log.type === "USER_SIGNUP") typeColor = "bg-blue-500/10 text-blue-400";
                  if (log.type === "FORM_SUBMISSION") typeColor = "bg-emerald-500/10 text-emerald-400";

                  return (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-surface-950/45 border border-surface-850/65 flex flex-col gap-1.5"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide ${typeColor}`}>
                          {log.type}
                        </span>
                        <span className="text-[9px] text-slate-500 font-semibold">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 leading-normal">
                        <span className="text-slate-400 font-medium">{log.actor}</span> {log.action}
                      </p>
                      <span className="text-[10px] text-slate-500 font-medium block truncate">
                        {log.details}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
