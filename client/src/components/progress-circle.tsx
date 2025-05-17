import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const progressCircleVariants = cva(
  "relative inline-flex items-center justify-center overflow-hidden rounded-full",
  {
    variants: {
      size: {
        sm: "h-16 w-16",
        md: "h-24 w-24",
        lg: "h-32 w-32",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

interface ProgressCircleProps extends VariantProps<typeof progressCircleVariants> {
  progress: number; // 0-100
  className?: string;
}

export function ProgressCircle({
  progress,
  size,
  className,
}: ProgressCircleProps) {
  const circumference = 2 * Math.PI * 45; // r = 45 is the radius of the circle
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn(progressCircleVariants({ size }), className)}>
      {/* Background circle */}
      <svg className="h-full w-full" viewBox="0 0 100 100">
        <circle
          className="stroke-gray-200 dark:stroke-gray-700"
          strokeWidth="10"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
        />
        {/* Progress circle */}
        <circle
          className="stroke-primary dark:stroke-primary transition-all duration-300 ease-in-out"
          strokeWidth="10"
          strokeLinecap="round"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {progress}%
        </span>
      </div>
    </div>
  );
}