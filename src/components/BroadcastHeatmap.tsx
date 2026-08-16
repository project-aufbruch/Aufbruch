import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  Legend,
} from 'recharts';
import { AnalyticsEvent } from '../services/analytics';
import { NostrEvent } from '../types';
import { Activity, Clock, Calendar, Zap, Filter, Flame, Info, ShieldCheck, Sparkles } from 'lucide-react';

interface BroadcastHeatmapProps {
  localEvents: AnalyticsEvent[];
  feedEvents?: NostrEvent[];
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);

export const BroadcastHeatmap: React.FC<BroadcastHeatmapProps> = ({
  localEvents,
  feedEvents = [],
}) => {
  const [filterType, setFilterType] = useState<'all' | 'broadcast' | 'zap' | 'media'>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [viewMode, setViewMode] = useState<'matrix' | 'hourly' | 'scatter'>('matrix');

  // Process timestamps from local IndexedDB events + feed events
  const processedData = useMemo(() => {
    const timestamps: number[] = [];

    // 1. Process local events from IndexedDB
    localEvents.forEach((evt) => {
      if (filterType === 'all') {
        timestamps.push(evt.timestamp);
      } else if (filterType === 'broadcast' && evt.type === 'broadcast_created') {
        timestamps.push(evt.timestamp);
      } else if (filterType === 'zap' && (evt.type === 'zap_sent' || evt.type === 'zap_received')) {
        timestamps.push(evt.timestamp);
      } else if (filterType === 'media' && evt.type === 'media_scrubbed') {
        timestamps.push(evt.timestamp);
      }
    });

    // 2. Process feed events (Nostr broadcasts)
    feedEvents.forEach((evt) => {
      if (filterType === 'all' || filterType === 'broadcast') {
        timestamps.push(evt.created_at * 1000); // convert to ms
      }
    });

    // Time cutoff
    const now = Date.now();
    const cutoff =
      timeRange === '7d'
        ? now - 7 * 86400000
        : timeRange === '30d'
        ? now - 30 * 86400000
        : 0;

    const filteredTimestamps = timestamps.filter((ts) => ts >= cutoff);

    // Initialize Day (0-6) x Hour (0-23) Matrix
    const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    const hourlyCounts = Array(24).fill(0);
    const dayCounts = Array(7).fill(0);

    filteredTimestamps.forEach((ts) => {
      const date = new Date(ts);
      const day = date.getDay(); // 0-6
      const hour = date.getHours(); // 0-23

      matrix[day][hour] += 1;
      hourlyCounts[hour] += 1;
      dayCounts[day] += 1;
    });

    // Recharts Hourly Bar/Area Data
    const hourlyChartData = HOURS_24.map((hour) => {
      const count = hourlyCounts[hour];
      const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
      return {
        hour: hourLabel,
        hourRaw: hour,
        count,
        fillColor: count > 30 ? '#f59e0b' : count > 15 ? '#10b981' : '#047857',
      };
    });

    // Recharts Scatter Chart Data
    const scatterData: Array<{ x: number; y: number; z: number; dayName: string; hourLabel: string }> = [];
    let maxCountInMatrix = 0;

    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const val = matrix[d][h];
        if (val > maxCountInMatrix) maxCountInMatrix = val;
        if (val > 0) {
          scatterData.push({
            x: h,
            y: d,
            z: val,
            dayName: DAYS_OF_WEEK[d],
            hourLabel: `${h.toString().padStart(2, '0')}:00`,
          });
        }
      }
    }

    // Find peak hour and peak day
    let peakHour = 0;
    let maxHourVal = -1;
    hourlyCounts.forEach((cnt, h) => {
      if (cnt > maxHourVal) {
        maxHourVal = cnt;
        peakHour = h;
      }
    });

    let peakDay = 0;
    let maxDayVal = -1;
    dayCounts.forEach((cnt, d) => {
      if (cnt > maxDayVal) {
        maxDayVal = cnt;
        peakDay = d;
      }
    });

    return {
      totalRecords: filteredTimestamps.length,
      matrix,
      hourlyChartData,
      scatterData,
      maxCountInMatrix: maxCountInMatrix || 1,
      peakHourFormatted: `${peakHour.toString().padStart(2, '0')}:00 - ${(peakHour + 1)
        .toString()
        .padStart(2, '0')}:00`,
      peakDayName: DAYS_OF_WEEK[peakDay],
      totalZapsOrBroadcasts: filteredTimestamps.length,
    };
  }, [localEvents, feedEvents, filterType, timeRange]);

  // Color helper for Heatmap Grid Cell based on frequency count
  const getCellBgColor = (count: number, maxCount: number) => {
    if (count === 0) return 'bg-zinc-900/60 border-zinc-800/60 text-zinc-700';
    const ratio = count / maxCount;
    if (ratio > 0.75) return 'bg-amber-500 border-amber-400 text-zinc-950 font-bold shadow-sm shadow-amber-500/20';
    if (ratio > 0.5) return 'bg-emerald-500 border-emerald-400 text-zinc-950 font-bold';
    if (ratio > 0.25) return 'bg-emerald-700 border-emerald-600 text-emerald-100';
    return 'bg-emerald-950/80 border-emerald-800/80 text-emerald-300';
  };

  return (
    <div className="bg-zinc-950 border border-emerald-900/80 rounded-2xl p-4 md:p-5 space-y-4 font-mono text-xs">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-950 border border-emerald-700 rounded-xl text-emerald-400">
            <Flame className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm">Broadcast Frequency Heatmap</h3>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Local IndexedDB Analytics
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans">
              Visualizing peak traffic hours and local broadcast patterns using Recharts
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Event Filter */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-[11px]">
            <Filter className="w-3 h-3 text-zinc-400 ml-1.5" />
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                filterType === 'all' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800' : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilterType('broadcast')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                filterType === 'broadcast' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Broadcasts
            </button>
            <button
              onClick={() => setFilterType('zap')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                filterType === 'zap' ? 'bg-amber-950 text-amber-300 font-bold border border-amber-800' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Zaps
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-[11px]">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                viewMode === 'matrix' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              7x24 Matrix
            </button>
            <button
              onClick={() => setViewMode('hourly')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                viewMode === 'hourly' ? 'bg-zinc-800 text-emerald-300 shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Recharts Hourly
            </button>
            <button
              onClick={() => setViewMode('scatter')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                viewMode === 'scatter' ? 'bg-zinc-800 text-amber-300 shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Recharts Scatter
            </button>
          </div>
        </div>
      </div>

      {/* Highlights & Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
        <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-xl space-y-0.5">
          <span className="text-zinc-400 text-[10px] block">Total Local Events</span>
          <span className="text-sm font-bold text-white">{processedData.totalRecords.toLocaleString()}</span>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-xl space-y-0.5">
          <span className="text-zinc-400 text-[10px] block flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Peak Hour Window</span>
          </span>
          <span className="text-sm font-bold text-amber-300">{processedData.peakHourFormatted}</span>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-xl space-y-0.5">
          <span className="text-zinc-400 text-[10px] block flex items-center gap-1">
            <Calendar className="w-3 h-3 text-cyan-400" />
            <span>Highest Traffic Day</span>
          </span>
          <span className="text-sm font-bold text-cyan-300">{processedData.peakDayName}</span>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-xl space-y-0.5">
          <span className="text-zinc-400 text-[10px] block flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>IndexedDB Engine</span>
          </span>
          <span className="text-sm font-bold text-emerald-400">Active (Zero Server)</span>
        </div>
      </div>

      {/* VIEW 1: 7x24 Matrix Heatmap Grid */}
      {viewMode === 'matrix' && (
        <div className="space-y-3 pt-1">
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[700px] space-y-1.5">
              {/* Hours Header */}
              <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono pl-12">
                {HOURS_24.map((h) => (
                  <div key={h} className="flex-1 text-center font-bold">
                    {h % 3 === 0 ? `${h}h` : ''}
                  </div>
                ))}
              </div>

              {/* 7 Days Rows */}
              {DAYS_OF_WEEK.map((dayName, dayIdx) => (
                <div key={dayName} className="flex items-center gap-1">
                  <span className="w-10 text-right pr-2 text-[11px] font-bold text-zinc-400 shrink-0">
                    {dayName}
                  </span>
                  <div className="flex-1 flex gap-1">
                    {HOURS_24.map((hour) => {
                      const count = processedData.matrix[dayIdx][hour];
                      const colorClass = getCellBgColor(count, processedData.maxCountInMatrix);
                      return (
                        <div
                          key={hour}
                          className={`flex-1 h-7 rounded border transition-all flex items-center justify-center text-[10px] group relative cursor-pointer hover:scale-110 hover:z-20 ${colorClass}`}
                        >
                          {count > 0 ? count : ''}

                          {/* Hover Tooltip */}
                          <div className="absolute bottom-full mb-1 hidden group-hover:block bg-zinc-900 border border-zinc-700 text-white p-2 rounded-lg shadow-xl text-[10px] font-mono whitespace-nowrap z-30 pointer-events-none">
                            <p className="font-bold text-emerald-400">{dayName} at {hour.toString().padStart(2, '0')}:00</p>
                            <p className="text-zinc-200">{count} events recorded</p>
                            <p className="text-zinc-400 text-[9px]">
                              {((count / (processedData.totalRecords || 1)) * 100).toFixed(1)}% of total volume
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-900">
            <div className="flex items-center gap-2">
              <span>Heat Scale:</span>
              <div className="flex items-center gap-1 font-mono">
                <span className="w-3 h-3 rounded bg-zinc-900 border border-zinc-800"></span>
                <span>0</span>
                <span className="w-3 h-3 rounded bg-emerald-950 border border-emerald-800"></span>
                <span>Low</span>
                <span className="w-3 h-3 rounded bg-emerald-700 border border-emerald-600"></span>
                <span>Med</span>
                <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-400"></span>
                <span>High</span>
                <span className="w-3 h-3 rounded bg-amber-500 border border-amber-400"></span>
                <span>Peak</span>
              </div>
            </div>
            <span className="text-zinc-500 font-sans">Hover any cell for hourly event breakdown</span>
          </div>
        </div>
      )}

      {/* VIEW 2: Recharts 24-Hour Area/Bar Distribution */}
      {viewMode === 'hourly' && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-300 font-bold">Recharts 24-Hour Broadcast Distribution Profile</span>
            <span className="text-emerald-400 font-mono">Smooth Spline Curve</span>
          </div>

          <div className="h-64 w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={processedData.hourlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#064e3b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="hour" stroke="#71717a" tick={{ fontSize: 10 }} />
                <YAxis stroke="#71717a" tick={{ fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-950 border border-emerald-700 p-2.5 rounded-xl text-xs font-mono shadow-xl">
                          <p className="font-bold text-emerald-300">{data.hour} Window</p>
                          <p className="text-white font-bold text-sm">{data.count} Broadcasts / Events</p>
                          <p className="text-zinc-400 text-[10px]">
                            {data.count > 20 ? '🔥 Peak Traffic Period' : 'Standard Traffic'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#emeraldGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VIEW 3: Recharts Scatter Plot Heatmap */}
      {viewMode === 'scatter' && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-300 font-bold">Recharts Scatter Bubbles (Z-Axis = Frequency Count)</span>
            <span className="text-amber-400 font-mono">Bubble Size = Local Event Density</span>
          </div>

          <div className="h-64 w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Hour"
                  unit=":00"
                  domain={[0, 23]}
                  stroke="#71717a"
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Day"
                  domain={[0, 6]}
                  ticks={[0, 1, 2, 3, 4, 5, 6]}
                  tickFormatter={(val) => DAYS_OF_WEEK[val] || ''}
                  stroke="#71717a"
                  tick={{ fontSize: 10 }}
                />
                <ZAxis type="number" dataKey="z" range={[40, 400]} name="Events" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-950 border border-amber-700 p-2.5 rounded-xl text-xs font-mono shadow-xl">
                          <p className="font-bold text-amber-300">
                            {data.dayName} @ {data.hourLabel}
                          </p>
                          <p className="text-white font-bold text-sm">{data.z} Local Events Recorded</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Broadcast Heatmap" data={processedData.scatterData} fill="#f59e0b" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl flex items-center justify-between text-[11px] text-zinc-400 font-sans">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Real-time local event listener syncing directly with IndexedDB store <code className="text-emerald-400 font-mono">events</code>.</span>
        </div>
        <span className="font-mono text-emerald-400 font-bold shrink-0">100% Client-Side</span>
      </div>
    </div>
  );
};
