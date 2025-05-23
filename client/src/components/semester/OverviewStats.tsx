import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";

export interface OverviewStatsProps {
  totalCredits: number;
  totalGradePoints: number;
  overallGPA: number;
}

/**
 * OverviewStats component - displays overall GPA and credits information
 */
const OverviewStats: React.FC<OverviewStatsProps> = ({
  totalCredits,
  totalGradePoints,
  overallGPA,
}) => {
  return (
    <div className="space-y-4 md:space-y-0 md:flex mb-6 gap-4">
      <Card className="flex-1 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 hover:bg-accent/50 cursor-pointer">
        <CardContent className="p-6">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Total Credits
          </div>
          <div className="text-2xl font-bold">{totalCredits}</div>
        </CardContent>
      </Card>
      <Card className="flex-1 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 hover:bg-accent/50 cursor-pointer">
        <CardContent className="p-6">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Total Grade Points
          </div>
          <div className="text-2xl font-bold">{totalGradePoints.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card className="flex-1 bg-primary/5 border-primary/20 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 hover:bg-primary/10 cursor-pointer">
        <CardContent className="p-6">
          <div className="text-sm font-medium text-primary mb-1">
            Overall GPA
          </div>
          <div className="text-2xl font-bold text-primary/90">{overallGPA.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default memo(OverviewStats);