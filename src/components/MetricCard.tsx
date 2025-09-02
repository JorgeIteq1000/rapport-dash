import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  variant?: "default" | "success" | "warning" | "info";
  className?: string;
}

const variantStyles = {
  default: "bg-dashboard-card border-dashboard-card-border",
  success: "bg-gradient-success border-dashboard-success/20",
  warning: "bg-dashboard-warning/10 border-dashboard-warning/20", 
  info: "bg-dashboard-info/10 border-dashboard-info/20"
};

const textVariants = {
  default: "text-foreground",
  success: "text-dashboard-success-foreground",
  warning: "text-dashboard-warning",
  info: "text-dashboard-info"
};

export const MetricCard = ({ 
  title, 
  value, 
  icon, 
  variant = "default", 
  className 
}: MetricCardProps) => {
  return (
    <Card className={cn(
      "p-6 shadow-card transition-all duration-300 hover:shadow-dashboard hover:scale-105",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn(
            "text-2xl font-bold",
            textVariants[variant]
          )}>
            {value}
          </p>
        </div>
        {icon && (
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            variant === "success" && "bg-dashboard-success/20 text-dashboard-success",
            variant === "warning" && "bg-dashboard-warning/20 text-dashboard-warning",
            variant === "info" && "bg-dashboard-info/20 text-dashboard-info",
            variant === "default" && "bg-primary/20 text-primary"
          )}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};