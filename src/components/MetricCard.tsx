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
  info: "bg-dashboard-info/10 border-dashboard-info/20",
};

// As cores dos ícones continuam dinâmicas, mas o texto agora será branco
const iconVariants = {
    default: "bg-primary/20 text-primary",
    success: "bg-dashboard-success/20 text-dashboard-success",
    warning: "bg-dashboard-warning/20 text-dashboard-warning",
    info: "bg-dashboard-info/20 text-dashboard-info",
}

export const MetricCard = ({
  title,
  value,
  icon,
  variant = "default",
  className,
}: MetricCardProps) => {
  return (
    <Card
      className={cn(
        "p-6 shadow-card transition-all duration-300 hover:shadow-dashboard hover:scale-105",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          {/* A cor do título foi alterada para um branco com 80% de opacidade */}
          <p className="text-sm font-medium text-primary-foreground/80">{title}</p>
          {/* A cor do valor foi alterada para branco */}
          <p className="text-2xl font-bold text-primary-foreground">
            {value}
          </p>
        </div>
        {icon && (
          <div
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              iconVariants[variant]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
