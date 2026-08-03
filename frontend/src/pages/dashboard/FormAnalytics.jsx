import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../../services/dashboardApi";
import {
  ArrowLeft,
  BarChart2,
  PieChart as PieChartIcon,
  Clock,
  CheckCircle2,
  FileText,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import SkeletonCard from "../../components/dashboard/SkeletonCard";

const CHART_COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#8b5cf6", // violet-500
  "#f59e0b", // amber-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#6366f1", // indigo-500
];

export default function FormAnalytics() {
  const { formId } = useParams();
  const navigate = useNavigate();

  const { data: analytics, isLoading, isError } = useQuery({
    queryKey: ["form-analytics", formId],
    queryFn: () => dashboardApi.getFormAnalytics(formId).then((r) => r.data),
    enabled: !!formId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-surface-900 animate-pulse" />
          <div className="h-6 w-48 bg-surface-900 rounded animate-pulse" />
        </div>
        <SkeletonCard type="stats" />
        <SkeletonCard type="table" />
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="p-8 text-center rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 font-medium">
        Failed to load analytics for this form.
      </div>
    );
  }

  const {
    form_title,
    total_submissions,
    avg_completion_time_seconds,
    field_distributions,
    daily_submissions,
    completion_time_buckets,
  } = analytics;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(`/dashboard/forms/${formId}/responses`)}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-surface-850 rounded-lg
                       border border-surface-850 shrink-0 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 truncate">
              {form_title} Analytics
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Visualized response distributions, submission velocity & completion metrics
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/dashboard/forms/${formId}/responses`)}
          className="btn-secondary text-xs flex items-center gap-1.5 shrink-0"
        >
          <FileText className="w-3.5 h-3.5" />
          View Raw Responses
        </button>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-surface-850 bg-surface-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Total Responses
            </span>
            <Users className="w-4 h-4 text-brand-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-100 tracking-tight">
              {total_submissions}
            </span>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">
              Submissions recorded to date
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-surface-850 bg-surface-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Avg. Completion Time
            </span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-100 tracking-tight">
              {avg_completion_time_seconds ? `${avg_completion_time_seconds}s` : "N/A"}
            </span>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">
              Average seconds spent filling form
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-surface-850 bg-surface-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Tracked Fields
            </span>
            <BarChart2 className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-100 tracking-tight">
              {field_distributions.length}
            </span>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">
              Active form questions analyzed
            </p>
          </div>
        </div>
      </div>

      {/* ── Submissions Trend Chart ── */}
      <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/40 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-brand-400" />
              Submission Trend (Last 30 Days)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily response frequency over time
            </p>
          </div>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily_submissions}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => val.slice(5)}
              />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "#f8fafc",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                name="Submissions"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", r: 4 }}
                activeDot={{ r: 6, fill: "#60a5fa" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Field Option Distributions (Pie / Bar Charts per Question) ── */}
      <div className="space-y-6">
        <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-emerald-400" />
          Question Breakdown & Option Distributions
        </h3>

        {field_distributions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-surface-850 text-slate-500 text-sm">
            No fields found in this form.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {field_distributions.map((field, idx) => {
              const isChoiceType = [
                "dropdown",
                "radio",
                "multi_checkbox",
                "rating",
              ].includes(field.field_type);
              const hasData = field.distribution && field.distribution.length > 0;

              return (
                <div
                  key={field.id}
                  className="p-5 rounded-2xl border border-surface-850 bg-surface-900/50 backdrop-blur-sm flex flex-col justify-between space-y-4"
                >
                  {/* Question Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-200 text-sm leading-snug">
                        {idx + 1}. {field.label}
                      </h4>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-800 text-slate-400 shrink-0">
                        {field.field_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span>{field.total_answers} answers</span>
                      <span>•</span>
                      <span>{field.response_rate}% response rate</span>
                    </div>
                  </div>

                  {/* Chart section */}
                  {!hasData ? (
                    <div className="h-48 flex items-center justify-center text-xs text-slate-600 border border-dashed border-surface-800 rounded-xl">
                      No responses submitted for this question yet
                    </div>
                  ) : isChoiceType ? (
                    <div className="h-56 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={field.distribution}
                            dataKey="count"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            innerRadius={35}
                            paddingAngle={3}
                            label={({ name, percent }) =>
                              `${name} (${(percent * 100).toFixed(0)}%)`
                            }
                            labelLine={false}
                          >
                            {field.distribution.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              borderColor: "#334155",
                              borderRadius: "0.5rem",
                              fontSize: "12px",
                              color: "#f8fafc",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    // Bar Chart for Text / Number / Email / Date fields
                    <div className="h-56 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={field.distribution.slice(0, 8)}
                          layout="vertical"
                          margin={{ left: 20, right: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                          <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                          <YAxis
                            type="category"
                            dataKey="label"
                            stroke="#64748b"
                            tick={{ fontSize: 11 }}
                            width={80}
                            tickFormatter={(v) => (v.length > 12 ? `${v.slice(0, 10)}…` : v)}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              borderColor: "#334155",
                              borderRadius: "0.5rem",
                              fontSize: "12px",
                              color: "#f8fafc",
                            }}
                          />
                          <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Frequency Table */}
                  {hasData && (
                    <div className="border-t border-surface-850 pt-3 space-y-1.5 max-h-36 overflow-y-auto">
                      {field.distribution.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs text-slate-400"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  CHART_COLORS[i % CHART_COLORS.length],
                              }}
                            />
                            <span className="truncate">{item.label || "(Empty)"}</span>
                          </div>
                          <span className="font-mono text-slate-200 font-semibold ml-2">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
