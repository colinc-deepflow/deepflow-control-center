import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useDashboardBuilder, DashboardSpec, DashboardComponent } from '@/hooks/useDashboardBuilder';
import { 
  Sparkles, 
  Loader2, 
  Layout, 
  Download, 
  Copy,
  Mail,
  BarChart3,
  Bell,
  CheckSquare,
  Activity,
  Table,
  Calendar,
  FileText,
  Zap,
  Settings,
  ExternalLink,
} from 'lucide-react';

interface ClientDashboardTabProps {
  project: {
    clientName: string;
    industry?: string;
    teamSize?: string;
    currentChallenges?: string;
    currentProcess?: string;
    desiredOutcomes?: string;
    notes?: string;
    workflowJson?: string;
  };
}

const componentIcons: Record<string, React.ElementType> = {
  'stats-card': BarChart3,
  'approval-queue': CheckSquare,
  'activity-feed': Activity,
  'chart': BarChart3,
  'data-table': Table,
  'status-indicator': Zap,
  'notification-center': Bell,
  'action-button': Zap,
  'file-list': FileText,
  'calendar': Calendar,
  'mail': Mail,
};

export const ClientDashboardTab = ({ project }: ClientDashboardTabProps) => {
  const [dashboardSpec, setDashboardSpec] = useState<DashboardSpec | null>(null);
  const { generateDashboard, isGenerating, error } = useDashboardBuilder();

  const handleGenerate = async () => {
    const projectContext = {
      clientName: project.clientName,
      industry: project.industry,
      teamSize: project.teamSize,
      currentChallenges: project.currentChallenges,
      currentProcess: project.currentProcess,
      desiredOutcomes: project.desiredOutcomes,
      notes: project.notes,
    };

    const result = await generateDashboard(projectContext, project.workflowJson);
    
    if (result) {
      setDashboardSpec(result);
      toast({
        title: "Dashboard Spec Generated!",
        description: "Your client dashboard specification is ready",
      });
    } else if (error) {
      toast({
        title: "Generation Failed",
        description: error,
        variant: "destructive",
      });
    }
  };

  const handleCopy = () => {
    if (dashboardSpec) {
      navigator.clipboard.writeText(JSON.stringify(dashboardSpec, null, 2));
      toast({
        title: "Copied!",
        description: "Dashboard spec copied to clipboard",
      });
    }
  };

  const handleDownload = () => {
    if (dashboardSpec) {
      const blob = new Blob([JSON.stringify(dashboardSpec, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.clientName.replace(/\s+/g, '_')}_dashboard_spec.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Downloaded!",
        description: "Dashboard spec saved to your device",
      });
    }
  };

  const getComponentIcon = (component: DashboardComponent) => {
    const Icon = componentIcons[component.type] || componentIcons[component.icon || ''] || Settings;
    return Icon;
  };

  if (!dashboardSpec) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center max-w-md">
          <Layout className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Client Dashboard Builder</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Generate a custom dashboard specification for {project.clientName}. 
            This will design a client-facing app where they can view their automation data and approve actions.
          </p>
          <Button
            className="gap-2"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isGenerating ? 'Designing Dashboard...' : 'Generate Dashboard Spec'}
          </Button>
          {error && (
            <p className="text-sm text-destructive mt-4">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 bg-muted/30 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{dashboardSpec.appName}</h3>
            <p className="text-sm text-muted-foreground">{dashboardSpec.description}</p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="w-3 h-3" />
            AI Generated
          </Badge>
        </div>
        <div className="flex gap-2 mt-4">
          <Badge variant="outline" style={{ borderColor: dashboardSpec.theme?.primaryColor }}>
            {dashboardSpec.theme?.style || 'modern'}
          </Badge>
          {dashboardSpec.features?.map((feature) => (
            <Badge key={feature} variant="secondary" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex gap-3 p-4 border-b bg-background">
        <Button className="gap-2" onClick={handleDownload}>
          <Download className="w-4 h-4" />
          Download Spec
        </Button>
        <Button variant="outline" className="gap-2" onClick={handleCopy}>
          <Copy className="w-4 h-4" />
          Copy JSON
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Regenerate
        </Button>
        <Button variant="outline" className="gap-2 ml-auto">
          <ExternalLink className="w-4 h-4" />
          Build in Lovable
        </Button>
      </div>

      {/* Dashboard Preview */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Pages */}
          {dashboardSpec.pages?.map((page, pageIndex) => (
            <Card key={pageIndex}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{page.name}</CardTitle>
                    <CardDescription>{page.path} • {page.layout} layout</CardDescription>
                  </div>
                  <Badge variant="outline">{page.components?.length || 0} components</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {page.components?.map((component, compIndex) => {
                    const Icon = getComponentIcon(component);
                    return (
                      <div
                        key={compIndex}
                        className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-md bg-background">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{component.title}</p>
                            <p className="text-xs text-muted-foreground">{component.type}</p>
                            {component.dataSource && (
                              <p className="text-xs text-muted-foreground/70 truncate mt-1">
                                {component.dataSource}
                              </p>
                            )}
                            {component.actions && (
                              <div className="flex gap-1 mt-2">
                                {component.actions.map((action) => (
                                  <Badge key={action} variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {action}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Data Connections */}
          {dashboardSpec.dataConnections && dashboardSpec.dataConnections.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-3">Data Connections</h4>
                <div className="grid grid-cols-2 gap-3">
                  {dashboardSpec.dataConnections.map((conn, index) => (
                    <div key={index} className="p-3 rounded-lg border bg-muted/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{conn.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{conn.type} • {conn.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
