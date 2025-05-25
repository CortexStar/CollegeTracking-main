import React, { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceArea,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Calendar, Target } from "lucide-react";

/**
 * GPA DASHBOARD – Enhanced v10
 * Improvements: Better typography, enhanced visual hierarchy, 
 * improved spacing, color refinements, and better organization
 */

export interface Semester {
  id: string;
  term: string;
  yearLevel: "Freshman" | "Sophomore" | "Junior" | "Senior";
  gpa: number | null;
  credits?: number;
  gradePoints?: number;
  sortKey?: number;
}

interface Props {
  semesters: Semester[];
}

// Enhanced color palette with better contrast and accessibility
const COLORS = {
  primary: "#059669", // Emerald-600 - better contrast than previous green
  secondary: "#7c3aed", // Violet-600 - refined purple
  accent: "#0ea5e9", // Sky-500 - for highlights
  muted: "#64748b", // Slate-500
  background: "rgba(255, 255, 255, 0.95)",
  backgroundDark: "rgba(15, 23, 42, 0.95)",
  border: "rgba(148, 163, 184, 0.2)",
  borderDark: "rgba(100, 116, 139, 0.3)",
};

// Forecasting parameters
const FORECAST_PARAMS = {
  ALPHA: 0.6,
  BETA: 0.05,
  PHI: 0.7,
};

const round2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);

const GpaDashboard: React.FC<Props> = ({ semesters }) => {
  const [mode, setMode] = useState<"history" | "overall" | "forecast">("history");

  // Enhanced cumulative calculation with better organization
  const cumulative = useMemo(() => {
    const orderedSemesters = [...semesters].sort((a, b) => {
      if (a.sortKey !== undefined && b.sortKey !== undefined) {
        return a.sortKey - b.sortKey;
      }
      return 0;
    });
    
    let totalCredits = 0;
    let totalGradePoints = 0;
    
    return orderedSemesters.map((semester) => {
      if (semester.gpa != null) {
        if (semester.credits != null && semester.gradePoints != null) {
          totalCredits += semester.credits;
          totalGradePoints += semester.gradePoints;
        } else {
          totalCredits += 1;
          totalGradePoints += semester.gpa;
        }
      }
      return { 
        ...semester, 
        cumulative: round2(totalCredits ? totalGradePoints / totalCredits : null) 
      };
    });
  }, [semesters]);

  // Enhanced forecast calculation
  const forecast = useMemo(() => {
    const lastValidIndex = cumulative.reduce(
      (idx, data, i) => (data.cumulative != null ? i : idx), 
      -1
    );
    
    if (lastValidIndex === -1) return cumulative;

    let level = cumulative[0].cumulative as number;
    let trend = 0;
    
    // Calculate trend using exponential smoothing
    for (let i = 1; i <= lastValidIndex; i++) {
      const currentValue = cumulative[i].cumulative as number;
      if (currentValue == null) break;
      
      const previousLevel = level;
      level = FORECAST_PARAMS.ALPHA * currentValue + 
              (1 - FORECAST_PARAMS.ALPHA) * (previousLevel + FORECAST_PARAMS.PHI * trend);
      trend = FORECAST_PARAMS.BETA * (level - previousLevel) + 
              (1 - FORECAST_PARAMS.BETA) * FORECAST_PARAMS.PHI * trend;
    }

    const series = cumulative.map((data, i) => ({ 
      ...data, 
      proj: i >= lastValidIndex ? data.cumulative : null 
    }));
    series[lastValidIndex].proj = cumulative[lastValidIndex].cumulative;

    // Generate future projections
    const yearLevels = ["Freshman", "Sophomore", "Junior", "Senior"] as const;
    const lastSemester = semesters[semesters.length - 1];
    let [season, yearStr] = lastSemester.term.split(" ") as ["Fall" | "Spring", string];
    let year = parseInt(yearStr, 10);
    let levelIndex = yearLevels.indexOf(lastSemester.yearLevel as any);
    
    // Advance to next semester
    if (season === "Fall") {
      season = "Spring";
      year += 1;
    } else {
      season = "Fall";
      if (levelIndex < 3) levelIndex++;
    }

    // Generate projections up to Spring 2027
    for (let horizon = 1; horizon <= 6; horizon++) {
      if (year > 2027 || (year === 2027 && season === "Spring")) break;
      
      const dampening = (1 - Math.pow(FORECAST_PARAMS.PHI, horizon)) / (1 - FORECAST_PARAMS.PHI);
      const projection = round2(
        Math.min(4, Math.max(0, level + FORECAST_PARAMS.PHI * dampening * trend))
      );
      
      series.push({
        id: `f-${season}-${year}`,
        term: `${season} ${year}`,
        yearLevel: yearLevels[levelIndex],
        gpa: null,
        proj: projection
      });
      
      // Advance semester
      if (season === "Fall") {
        season = "Spring";
      } else {
        season = "Fall";
        year += 1;
        if (levelIndex < 3) levelIndex++;
      }
    }
    
    return series;
  }, [cumulative, semesters]);

  // Enhanced view configuration with better organization
  const viewConfig = useMemo(() => {
    const configs = {
      history: {
        data: [...semesters]
          .sort((a, b) => {
            if (a.sortKey !== undefined && b.sortKey !== undefined) {
              return a.sortKey - b.sortKey;
            }
            return 0;
          })
          .map((s) => ({ ...s, gpa: round2(s.gpa) })),
        primaryKey: "gpa",
        primaryColor: COLORS.primary,
        primaryLabel: "Semester GPA",
        secondaryKey: null,
        secondaryColor: null,
        secondaryLabel: null,
        title: "Semester GPA History",
        icon: Calendar,
        description: "Individual semester performance"
      },
      overall: {
        data: cumulative,
        primaryKey: "cumulative",
        primaryColor: COLORS.primary,
        primaryLabel: "Cumulative GPA",
        secondaryKey: null,
        secondaryColor: null,
        secondaryLabel: null,
        title: "Cumulative GPA Progression",
        icon: TrendingUp,
        description: "Overall academic performance"
      },
      forecast: {
        data: forecast,
        primaryKey: "proj",
        primaryColor: COLORS.secondary,
        primaryLabel: "Projected GPA",
        secondaryKey: "cumulative",
        secondaryColor: COLORS.primary,
        secondaryLabel: "Historical GPA",
        title: "GPA Forecast & Projection",
        icon: Target,
        description: "Predicted future performance"
      }
    };
    
    return configs[mode];
  }, [mode, semesters, cumulative, forecast]);

  // Enhanced year level styling
  const yearLevelColors = {
    Freshman: "rgba(34, 197, 94, 0.08)", // Green
    Sophomore: "rgba(59, 130, 246, 0.08)", // Blue  
    Junior: "rgba(168, 85, 247, 0.08)", // Purple
    Senior: "rgba(249, 115, 22, 0.08)" // Orange
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-4 shadow-lg">
        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {entry.name}: <span className="font-medium">
                {entry.value != null ? entry.value.toFixed(2) : "–"}
              </span>
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-6xl mx-auto backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700/60 shadow-2xl rounded-3xl overflow-hidden">
      {/* Enhanced Header */}
      <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 dark:from-slate-800/80 dark:to-slate-900/80 border-b border-slate-200/40 dark:border-slate-700/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Title Section */}
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
              <viewConfig.icon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                {viewConfig.title}
              </CardTitle>
              <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
                {viewConfig.description}
              </p>
            </div>
          </div>

          {/* Toggle Controls */}
          <ToggleGroup 
            type="single" 
            value={mode} 
            onValueChange={(v) => v && setMode(v as any)} 
            className="bg-white/60 dark:bg-slate-800/60 border border-slate-300/60 dark:border-slate-600/60 rounded-2xl p-1 backdrop-blur-sm shadow-inner"
          >
            <ToggleGroupItem 
              value="history" 
              className="px-6 py-3 rounded-xl font-medium transition-all duration-200 data-[state=on]:bg-white data-[state=on]:shadow-md data-[state=on]:text-slate-900 dark:data-[state=on]:bg-slate-700 dark:data-[state=on]:text-slate-100"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Semester
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="overall" 
              className="px-6 py-3 rounded-xl font-medium transition-all duration-200 data-[state=on]:bg-white data-[state=on]:shadow-md data-[state=on]:text-slate-900 dark:data-[state=on]:bg-slate-700 dark:data-[state=on]:text-slate-100"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Cumulative
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="forecast" 
              className="px-6 py-3 rounded-xl font-medium transition-all duration-200 data-[state=on]:bg-white data-[state=on]:shadow-md data-[state=on]:text-slate-900 dark:data-[state=on]:bg-slate-700 dark:data-[state=on]:text-slate-100"
            >
              <Target className="w-4 h-4 mr-2" />
              Forecast
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>

      {/* Chart Content */}
      <CardContent className="p-0">
        <div className="w-full h-[600px] p-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={viewConfig.data} 
              margin={{ top: 40, right: 40, left: 20, bottom: 60 }}
            >
              {/* Enhanced Grid */}
              <CartesianGrid 
                strokeDasharray="2 4" 
                strokeOpacity={0.1} 
                stroke="currentColor"
                className="text-slate-400 dark:text-slate-600"
              />
              
              {/* Enhanced Axes */}
              <XAxis 
                dataKey="term" 
                interval="preserveStartEnd"
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: 13, 
                  fontWeight: 500,
                  fill: "currentColor"
                }}
                className="text-slate-600 dark:text-slate-400"
                dy={10}
              />
              <YAxis 
                domain={[2, 4]} 
                ticks={[2, 2.5, 3, 3.5, 4]}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v.toFixed(1)}
                tick={{ 
                  fontSize: 13, 
                  fontWeight: 500,
                  fill: "currentColor"
                }}
                className="text-slate-600 dark:text-slate-400"
                dx={-10}
              />
              
              {/* Custom Tooltip */}
              <Tooltip content={<CustomTooltip />} />
              
              {/* Enhanced Legend */}
              <Legend 
                verticalAlign="top" 
                height={36}
                wrapperStyle={{ 
                  paddingBottom: 20,
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '24px'
                }}
              />

              {/* Year Level Background Areas */}
              {(["Freshman", "Sophomore", "Junior", "Senior"] as const).map((level) => {
                const positions = viewConfig.data
                  .map((d, i) => (d.yearLevel === level ? i : -1))
                  .filter((i) => i !== -1);
                
                return positions.length > 0 ? (
                  <ReferenceArea 
                    key={level}
                    x1={Math.min(...positions) - 0.5} 
                    x2={Math.max(...positions) + 0.5}
                    fill={yearLevelColors[level]}
                    strokeOpacity={0}
                  />
                ) : null;
              })}

              {/* Secondary Line (for forecast mode) */}
              {viewConfig.secondaryKey && (
                <Line
                  type="monotone"
                  dataKey={viewConfig.secondaryKey}
                  name={viewConfig.secondaryLabel}
                  stroke={viewConfig.secondaryColor}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray="none"
                  dot={{ 
                    r: 6, 
                    fill: viewConfig.secondaryColor, 
                    stroke: "white", 
                    strokeWidth: 3,
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                  }}
                  connectNulls
                />
              )}

              {/* Primary Line */}
              <Line
                type="monotone"
                dataKey={viewConfig.primaryKey}
                name={viewConfig.primaryLabel}
                stroke={viewConfig.primaryColor}
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={mode === "forecast" ? "8 4" : "none"}
                dot={{ 
                  r: 7, 
                  fill: viewConfig.primaryColor, 
                  stroke: "white", 
                  strokeWidth: 3,
                  filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.15))"
                }}
                activeDot={{
                  r: 9,
                  stroke: viewConfig.primaryColor,
                  strokeWidth: 3,
                  fill: "white",
                  filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
                }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Demo data for testing
const demoSemesters = [
  { id: "1", term: "Fall 2022", yearLevel: "Freshman" as const, gpa: 3.2, sortKey: 1 },
  { id: "2", term: "Spring 2023", yearLevel: "Freshman" as const, gpa: 3.4, sortKey: 2 },
  { id: "3", term: "Fall 2023", yearLevel: "Sophomore" as const, gpa: 3.6, sortKey: 3 },
  { id: "4", term: "Spring 2024", yearLevel: "Sophomore" as const, gpa: 3.5, sortKey: 4 },
  { id: "5", term: "Fall 2024", yearLevel: "Junior" as const, gpa: 3.7, sortKey: 5 },
];

export default function DemoGpaDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
      <GpaDashboard semesters={demoSemesters} />
    </div>
  );
}