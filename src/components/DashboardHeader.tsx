import { Button } from "@/components/ui/button";
import { Zap, Settings } from "lucide-react";
import { formatCurrency } from "@/lib/dateUtils";

interface DashboardHeaderProps {
  totalProjects: number;
  pipelineValue: number;
  newThisWeek: number;
  onSettingsClick: () => void;
}

export const DashboardHeader = ({
  totalProjects,
  pipelineValue,
  newThisWeek,
  onSettingsClick,
}: DashboardHeaderProps) => {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              DeepFlow AI
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{totalProjects}</div>
              <div className="text-xs text-muted-foreground">Active Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{formatCurrency(pipelineValue)}</div>
              <div className="text-xs text-muted-foreground">Pipeline Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{newThisWeek}</div>
              <div className="text-xs text-muted-foreground">New This Week</div>
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={onSettingsClick}
            className="rounded-xl"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        <div className="md:hidden grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">{totalProjects}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">{formatCurrency(pipelineValue)}</div>
            <div className="text-xs text-muted-foreground">Pipeline</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-accent">{newThisWeek}</div>
            <div className="text-xs text-muted-foreground">New</div>
          </div>
        </div>
      </div>
    </header>
  );
};
