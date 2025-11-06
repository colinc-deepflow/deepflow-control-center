import { Button } from "@/components/ui/button";
import { Settings, Bell } from "lucide-react";
import { formatCurrency } from "@/lib/dateUtils";
import deepflowLogo from "@/assets/deepflow-logo.png";

interface DashboardHeaderProps {
  totalProjects: number;
  pipelineValue: number;
  newThisWeek: number;
  hasNewProjects: boolean;
  onSettingsClick: () => void;
}

export const DashboardHeader = ({
  totalProjects,
  pipelineValue,
  newThisWeek,
  hasNewProjects,
  onSettingsClick,
}: DashboardHeaderProps) => {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={deepflowLogo} 
              alt="DeepFlow AI" 
              className="h-12 w-auto"
            />
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

          <div className="flex items-center gap-2">
            {hasNewProjects && (
              <div className="relative">
                <Bell className="w-5 h-5 text-accent animate-pulse" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-ping" />
              </div>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={onSettingsClick}
              className="rounded-xl"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
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
