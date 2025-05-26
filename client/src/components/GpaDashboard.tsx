import React, { useMemo, useState } from "react";

// UI Components
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Charting Library
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

// Animation Library
import { motion } from "framer-motion";

/**
 * GPA DASHBOARD – v9.4 (Corrected In-Progress & Future Forecasting)
 * - Forecast line correctly includes in-progress semesters from input.
 * - Future appended semester sequence is corrected.
 * - Green line for actual cumulative GPA, Purple line for forecast starting from last actual point.
 */

// --- Constants ---
const CHART_COLOR_SEMESTER_GPA = "#10b981";
const CHART_COLOR_CUMULATIVE_GPA_ACTUAL = "#10b981"; // Green for actual cumulative
const CHART_COLOR_GPA_FORECAST = "#8b5cf6";      // Purple for forecast

const HW_ALPHA = 0.6;
const HW_BETA = 0.05;
const HW_PHI = 0.7;

const MAX_FORECAST_PERIODS = 8; // Max *newly appended* future semesters
const FORECAST_TERMINATION_YEAR = 2027;
const FORECAST_TERMINATION_SEASON: "Fall" | "Spring" = "Spring";

const YEAR_LEVELS = ["Freshman", "Sophomore", "Junior", "Senior"] as const;
type YearLevel = typeof YEAR_LEVELS[number];
type GpaMode = "history" | "overall" | "forecast";

// --- Interfaces ---
export interface Semester {
  id: string;
  term: string;
  yearLevel: YearLevel;
  gpa: number | null; // Null for in-progress semesters
  credits?: number;
  gradePoints?: number;
  sortKey?: number;
}

interface ProcessedChartDataPoint extends Semester {
  cumulativeGpa?: number | null;
  projectedGpa?: number | null;
}

interface ChartViewConfig {
  data: ProcessedChartDataPoint[];
  mainDataKey: keyof ProcessedChartDataPoint;
  mainLineColor: string;
  mainLineLabel: string;
  observedDataKey?: keyof ProcessedChartDataPoint | null;
  observedLineColor?: string;
  observedLineLabel?: string;
  yAxisDomain?: [number | string, number | string];
}

// --- Utility Functions ---
const roundToTwoDecimals = (value: number | null): number | null =>
  value === null || isNaN(value) ? null : Math.round(value * 100) / 100;

const sortSemesters = (semestersToSort: Semester[]): Semester[] => {
  return [...semestersToSort].sort((a, b) => {
    if (a.sortKey !== undefined && b.sortKey !== undefined) {
      return a.sortKey - b.sortKey;
    }
    const [aSeason, aYearStr] = a.term.split(" ");
    const [bSeason, bYearStr] = b.term.split(" ");
    const aYear = parseInt(aYearStr, 10);
    const bYear = parseInt(bYearStr, 10);
    if (aYear !== bYear) return aYear - bYear;
    return (aSeason === "Spring" ? 0 : 1) - (bSeason === "Spring" ? 0 : 1); // Spring before Fall
  });
};

// --- Component ---
const GpaDashboard: React.FC<{ semesters: Semester[] }> = ({ semesters }) => {
  const [mode, setMode] = useState<GpaMode>("history");

  const chronologicallySortedSemesters = useMemo(() => {
    return sortSemesters(semesters);
  }, [semesters]);

  const cumulativeData = useMemo(() => {
    let totalCredits = 0;
    let totalGradePoints = 0;
    return chronologicallySortedSemesters.map((s) => {
      let currentCumulativeGpa: number | null = null;
      if (s.gpa !== null) { // s.gpa is null for in-progress
        if (s.credits != null && s.gradePoints != null) {
          totalCredits += s.credits;
          totalGradePoints += s.gradePoints;
        } else {
          const proxyCredits = s.credits ?? (s.gpa !== null ? 15 : 0);
          const proxyGradePoints = s.gradePoints ?? (s.gpa !== null ? s.gpa * proxyCredits : 0);
          totalCredits += proxyCredits;
          totalGradePoints += proxyGradePoints;
        }
      }
      if (totalCredits > 0) {
        currentCumulativeGpa = roundToTwoDecimals(totalGradePoints / totalCredits);
      }
      // For in-progress semesters (s.gpa is null), currentCumulativeGpa will hold the value from *before* this semester.
      return { ...s, cumulativeGpa: currentCumulativeGpa };
    });
  }, [chronologicallySortedSemesters]);

  const forecastData = useMemo(() => {
    const lastCompletedSemesterIndex = cumulativeData.reduce(
        (idx, d, i) => (d.gpa !== null ? i : idx), -1
    );

    if (lastCompletedSemesterIndex < 0) { // No completed semesters to base forecast on
        return cumulativeData.map(d => ({
            ...d,
            projectedGpa: null
        }));
    }

    const trainingDataCumulativeGpas = cumulativeData
        .slice(0, lastCompletedSemesterIndex + 1)
        .map(d => d.cumulativeGpa)
        .filter(gpa => gpa !== null) as number[];

    if (trainingDataCumulativeGpas.length === 0) {
        return cumulativeData.map(d => ({ ...d, projectedGpa: null }));
    }

    let L = trainingDataCumulativeGpas[0];
    let T = 0;
    if (trainingDataCumulativeGpas.length >= 2) {
        T = trainingDataCumulativeGpas[1] - trainingDataCumulativeGpas[0];
    }
    for (let i = 1; i < trainingDataCumulativeGpas.length; i++) {
        const y = trainingDataCumulativeGpas[i];
        const prevL = L;
        L = HW_ALPHA * y + (1 - HW_ALPHA) * (prevL + HW_PHI * T);
        T = HW_BETA * (L - prevL) + (1 - HW_BETA) * HW_PHI * T;
    }

    // Process all semesters from input (chronologicallySortedSemesters)
    // This will set projectedGpa for in-progress semesters.
    const seriesWithInProgressForecast: ProcessedChartDataPoint[] = chronologicallySortedSemesters.map((s_orig, index) => {
        const actualCumulativeGpa = cumulativeData[index]?.cumulativeGpa ?? null;
        let forecastedGpa: number | null = null;

        if (index < lastCompletedSemesterIndex) {
            forecastedGpa = null; // Purple line doesn't draw before last actual point
        } else if (index === lastCompletedSemesterIndex) {
            forecastedGpa = actualCumulativeGpa; // Purple line starts here, matching green
        } else {
            // This is an in-progress semester (from input) or beyond
            const h = index - lastCompletedSemesterIndex;
            const dampingFactorSum = (HW_PHI === 1) ? h : (1 - Math.pow(HW_PHI, h)) / (1 - HW_PHI);
            let yHat = L + dampingFactorSum * T;
            forecastedGpa = roundToTwoDecimals(Math.min(4.0, Math.max(0.0, yHat)));
        }
        return {
            ...s_orig,
            cumulativeGpa: actualCumulativeGpa,
            projectedGpa: forecastedGpa,
        };
    });

    // Append purely future semesters
    const finalSeries = [...seriesWithInProgressForecast];
    const lastKnownSemester = finalSeries[finalSeries.length - 1];

    if (lastKnownSemester) {
        let loopSeason = lastKnownSemester.term.split(" ")[0] as "Fall" | "Spring";
        let loopYear = parseInt(lastKnownSemester.term.split(" ")[1]);
        // Ensure yearLevelIdx is valid, defaulting to 0 or last known if YEAR_LEVELS is not empty
        let loopYearLevelIdx = YEAR_LEVELS.indexOf(lastKnownSemester.yearLevel);
        if (loopYearLevelIdx < 0) {
            loopYearLevelIdx = YEAR_LEVELS.length > 0 ? 0 : -1; // Default to Freshman or handle if no year levels
        }


        for (let k = 0; k < MAX_FORECAST_PERIODS; k++) {
            const prevSeasonForYearLevelUpdate = loopSeason;

            // Correctly advance to the NEXT term
            if (loopSeason === "Spring") {
                loopSeason = "Fall";
                // loopYear remains the same (e.g., Spring 2025 -> Fall 2025)
            } else { // loopSeason was "Fall"
                loopSeason = "Spring";
                loopYear += 1; // (e.g., Fall 2025 -> Spring 2026)
            }

            // Advance year level if moving from Spring to a new Fall academic term
            if (loopSeason === "Fall" && prevSeasonForYearLevelUpdate === "Spring") {
                if (loopYearLevelIdx >= 0 && loopYearLevelIdx < YEAR_LEVELS.length - 1) {
                    loopYearLevelIdx++;
                }
            }
            
            // Check termination condition for appended points
            const currentPointOrderVal = loopYear * 10 + (loopSeason === "Spring" ? 0 : 1);
            const terminationPointOrderVal = FORECAST_TERMINATION_YEAR * 10 + (FORECAST_TERMINATION_SEASON === "Spring" ? 0 : 1);

            if (currentPointOrderVal > terminationPointOrderVal) {
                break; // Stop if we've passed the termination date
            }

            const h = (finalSeries.length - 1 - lastCompletedSemesterIndex) + 1; // Steps from last actual for this new point
            const dampingFactorSum = (HW_PHI === 1) ? h : (1 - Math.pow(HW_PHI, h)) / (1 - HW_PHI);
            let yHat = L + dampingFactorSum * T;
            
            finalSeries.push({
                id: `appended-forecast-${k}`,
                term: `${loopSeason} ${loopYear}`,
                yearLevel: loopYearLevelIdx >=0 ? YEAR_LEVELS[loopYearLevelIdx] : lastKnownSemester.yearLevel, // Fallback for yearlevel
                gpa: null,
                cumulativeGpa: null,
                projectedGpa: roundToTwoDecimals(Math.min(4.0, Math.max(0.0, yHat))),
            });

            // If this point *is* the termination point, stop after adding it.
            if (currentPointOrderVal === terminationPointOrderVal) {
                break;
            }
        }
    }
    return finalSeries;
  }, [cumulativeData, chronologicallySortedSemesters]);

  const chartViewConfig = useMemo((): ChartViewConfig => {
    const baseConfig = {
      yAxisDomain: [1.5, 4.0] as [number, number],
    };
    switch (mode) {
      case "history":
        return {
          ...baseConfig,
          data: chronologicallySortedSemesters.map(s => ({...s, gpa: roundToTwoDecimals(s.gpa)})),
          mainDataKey: "gpa",
          mainLineColor: CHART_COLOR_SEMESTER_GPA,
          mainLineLabel: "Semester GPA",
        };
      case "overall":
        return {
          ...baseConfig,
          data: cumulativeData,
          mainDataKey: "cumulativeGpa",
          mainLineColor: CHART_COLOR_CUMULATIVE_GPA_ACTUAL,
          mainLineLabel: "Cumulative GPA",
        };
      case "forecast":
        return {
          ...baseConfig,
          data: forecastData,
          mainDataKey: "projectedGpa", // Purple line
          mainLineColor: CHART_COLOR_GPA_FORECAST,
          mainLineLabel: "Projected GPA",
          observedDataKey: "cumulativeGpa", // Green line
          observedLineColor: CHART_COLOR_CUMULATIVE_GPA_ACTUAL,
          observedLineLabel: "Cumulative GPA",
        };
    }
  }, [mode, chronologicallySortedSemesters, cumulativeData, forecastData]);

  const getTitle = (): string => {
    if (mode === "history") return "Semester GPA History";
    if (mode === "overall") return "Overall Cumulative GPA";
    if (mode === "forecast") return "GPA Forecast";
    return "GPA Dashboard";
  };

  return (
    <Card className="w-full backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/30 dark:border-slate-700/40 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:p-6">
        <div className="min-w-0">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200 truncate">
            {getTitle()}
          </CardTitle>
        </div>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => value && setMode(value as GpaMode)}
          className="border border-slate-300 dark:border-slate-700 rounded-full overflow-hidden backdrop-blur-sm shrink-0"
          aria-label="Select GPA view mode"
        >
          <ToggleGroupItem value="history" className="px-3 py-1.5 sm:px-4 text-xs sm:text-sm" aria-label="Semester GPA">Semester</ToggleGroupItem>
          <ToggleGroupItem value="overall" className="px-3 py-1.5 sm:px-4 text-xs sm:text-sm" aria-label="Cumulative GPA">Cumulative</ToggleGroupItem>
          <ToggleGroupItem value="forecast" className="px-3 py-1.5 sm:px-4 text-xs sm:text-sm" aria-label="GPA Forecast">Forecast</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>

      <CardContent className="p-0">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="w-full h-[450px] sm:h-[500px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartViewConfig.data}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} />
              <XAxis
                dataKey="term"
                interval="preserveStartEnd"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                dy={10}
              />
              <YAxis
                domain={chartViewConfig.yAxisDomain}
                ticks={[1.5, 2.0, 2.5, 3.0, 3.5, 4.0]}
                tickFormatter={(value) => typeof value === 'number' ? value.toFixed(2) : String(value)}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                dx={-5}
              />
              <Tooltip
                formatter={(value: number | string | Array<number | string>, name: string) => {
                    const val = typeof value === 'number' ? roundToTwoDecimals(value) : value;
                    return [val, name];
                }}
                labelFormatter={(label) => `Term: ${label}`}
                contentStyle={{
                  backdropFilter: "blur(8px)",
                  backgroundColor: "hsla(var(--popover), 0.85)",
                  color: "hsl(var(--popover-foreground))",
                  borderRadius: "0.75rem",
                  border: "1px solid hsl(var(--border))",
                  boxShadow: "var(--shadow-md)",
                }}
                cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "3 3" }}
                animationDuration={200}
              />
              <Legend
                verticalAlign="top"
                align="right"
                height={40}
                iconSize={10}
                wrapperStyle={{ paddingTop: 0, paddingBottom: 10, paddingRight: 10 }}
                formatter={(value) => <span className="text-xs text-muted-foreground dark:text-slate-400 ml-1">{value}</span>}
              />

              {YEAR_LEVELS.map((lvl) => {
                const yearLevelIndices = chartViewConfig.data
                  .map((d, i) => (d.yearLevel === lvl ? i : -1))
                  .filter((i) => i !== -1);
                if (!yearLevelIndices.length) return null;
                return (
                  <ReferenceArea
                    key={lvl}
                    x1={Math.min(...yearLevelIndices) - 0.5}
                    x2={Math.max(...yearLevelIndices) + 0.5}
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.2}
                    fill="hsl(var(--primary) / 0.03)"
                    ifOverflow="hidden"
                    aria-label={`${lvl} year duration`}
                  />
                );
              })}

              {chartViewConfig.observedDataKey && chartViewConfig.observedLineColor && (
                <Line
                  type="monotone"
                  dataKey={chartViewConfig.observedDataKey}
                  name={chartViewConfig.observedLineLabel || "Observed"}
                  stroke={chartViewConfig.observedLineColor}
                  strokeWidth={2.5}
                  strokeOpacity={0.8}
                  strokeLinecap="round"
                  dot={{ r: 4, fill: chartViewConfig.observedLineColor, stroke: "hsl(var(--background))", strokeWidth: 1.5 }}
                  connectNulls
                  animationDuration={500}
                />
              )}

              <Line
                type="monotone"
                dataKey={chartViewConfig.mainDataKey}
                name={chartViewConfig.mainLineLabel}
                stroke={chartViewConfig.mainLineColor}
                strokeWidth={3}
                strokeLinecap="round"
                dot={{ r: 5, fill: chartViewConfig.mainLineColor, stroke: "hsl(var(--background))", strokeWidth: 2 }}
                connectNulls
                animationDuration={500}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default GpaDashboard;