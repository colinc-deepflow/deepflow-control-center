import { Card } from "@/components/ui/card";
import { TrendingUp, DollarSign, Target } from "lucide-react";
import { formatCurrency } from "@/lib/dateUtils";

interface StatsCardsProps {
  totalProjects: number;
  totalRevenue: number;
  conversionRate: number;
}

export const StatsCards = ({ totalProjects, totalRevenue, conversionRate }: StatsCardsProps) => {
  const stats = [
    {
      label: "Total Projects",
      value: totalProjects,
      icon: Target,
      color: "text-primary",
    },
    {
      label: "Revenue Pipeline",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-accent",
    },
    {
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: "text-status-deployed",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
