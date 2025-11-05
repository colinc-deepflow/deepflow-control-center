import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Project } from "@/lib/googleSheets";
import { formatCurrency, getRelativeTimeString } from "@/lib/dateUtils";
import { Mail, Calendar, TrendingUp, DollarSign } from "lucide-react";

interface ProjectDetailModalProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (projectId: string, newStatus: Project['status']) => void;
}

const statusOptions: Project['status'][] = [
  'New Lead',
  'Contacted',
  'Building',
  'Deployed',
  'Live',
];

export const ProjectDetailModal = ({
  project,
  open,
  onOpenChange,
  onStatusChange,
}: ProjectDetailModalProps) => {
  const [notes, setNotes] = useState(project?.notes || '');

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {project.clientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
              </div>
              <p className="text-sm font-medium pl-6">{project.clientEmail}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
              </div>
              <p className="text-sm font-medium pl-6">
                {getRelativeTimeString(project.timestamp)}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Lead Score:</span>
              </div>
              <p className="text-sm font-medium pl-6">{project.leadScore}/100</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Revenue:</span>
              </div>
              <p className="text-sm font-medium pl-6">
                {formatCurrency(project.revenueValue)}
              </p>
            </div>
          </div>

          {project.phase && (
            <div>
              <Label className="text-sm text-muted-foreground">Phase</Label>
              <p className="mt-1 font-medium">{project.phase}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={project.status}
              onValueChange={(value) => onStatusChange(project.id, value as Project['status'])}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this project..."
              rows={4}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = `mailto:${project.clientEmail}`}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email Client
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
