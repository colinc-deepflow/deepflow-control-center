import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/lib/googleSheets";
import { formatCurrency, getRelativeTimeString } from "@/lib/dateUtils";
import { TrendingUp, Sparkles } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  isNew?: boolean;
}

const statusColors = {
  'New Lead': 'bg-status-new text-white',
  'Contacted': 'bg-primary text-primary-foreground',
  'Building': 'bg-status-building text-white',
  'Deployed': 'bg-status-deployed text-white',
  'Live': 'bg-status-live text-white',
};

export const ProjectCard = ({ project, onClick, isNew = false }: ProjectCardProps) => {
  return (
    <Card
      className={`p-6 hover:shadow-lg transition-all cursor-pointer border-border hover:border-primary/50 relative ${
        isNew ? 'animate-pulse border-accent/50 shadow-accent/20 shadow-lg' : ''
      }`}
      onClick={onClick}
    >
      {isNew && (
        <div className="absolute -top-2 -right-2 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg animate-bounce">
          <Sparkles className="w-3 h-3" />
          NEW
        </div>
      )}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-foreground truncate mb-1">
              {project.clientName}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {project.clientEmail}
            </p>
          </div>
          <Badge className={statusColors[project.status]}>
            {project.status}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>Score: {project.leadScore}/100</span>
            </div>
          </div>
          <span className="text-muted-foreground">
            {getRelativeTimeString(project.timestamp)}
          </span>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(project.revenueValue)}
          </div>
          {project.phase && (
            <p className="text-sm text-muted-foreground mt-1">
              Phase: {project.phase}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
