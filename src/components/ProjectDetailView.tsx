import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Project, GoogleSheetsConfig } from "@/lib/googleSheets";
import { formatCurrency, getRelativeTimeString } from "@/lib/dateUtils";
import { 
  Mail, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Phone, 
  Building2,
  Users,
  AlertCircle,
  Copy,
  Download,
  Printer,
  Play,
  CheckCircle,
  XCircle,
  Archive,
  ChevronLeft,
  ChevronRight,
  FileJson,
  FileCode,
  ClipboardList,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "@/hooks/use-toast";
import { BuildProgressTab } from "./BuildProgressTab";

interface ProjectDetailViewProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (projectId: string, newStatus: Project['status']) => void;
  config: GoogleSheetsConfig;
}

const statusOptions: Project['status'][] = [
  'New Lead',
  'Contacted',
  'Building',
  'Deployed',
  'Live',
];

export const ProjectDetailView = ({
  project,
  open,
  onOpenChange,
  onStatusChange,
  config,
}: ProjectDetailViewProps) => {
  const [notes, setNotes] = useState(project?.notes || '');
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (project) {
      setNotes(project.notes || '');
    }
  }, [project]);

  if (!project) return null;

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleDownloadJSON = () => {
    if (!project.workflowJson) return;
    const blob = new Blob([project.workflowJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.clientName.replace(/\s+/g, '_')}_workflow.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded!",
      description: "Workflow JSON saved to your device",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
    } else if (e.key === 'ArrowLeft') {
      const tabs = ['overview', 'proposal', 'build-guide', 'workflow', 'progress'];
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    } else if (e.key === 'ArrowRight') {
      const tabs = ['overview', 'proposal', 'build-guide', 'workflow', 'progress'];
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      }
    }
  };

  const buildGuideProgress = project.buildGuideMarkdown 
    ? Math.floor(Math.random() * 100) // TODO: Calculate actual progress from checkboxes
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-6xl h-[90vh] p-0 overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                {project.clientName}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Projects &gt; {project.clientName} &gt; {activeTab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {project.status}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start rounded-none border-b px-6 h-12 bg-transparent">
            <TabsTrigger value="overview" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="proposal" className="gap-2">
              <FileCode className="w-4 h-4" />
              Proposal
            </TabsTrigger>
            <TabsTrigger value="build-guide" className="gap-2">
              <FileCode className="w-4 h-4" />
              Build Guide
            </TabsTrigger>
            <TabsTrigger value="workflow" className="gap-2">
              <FileJson className="w-4 h-4" />
              Workflow JSON
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Build Progress
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview" className="p-6 space-y-6 m-0">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Client Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{project.clientEmail}</p>
                      </div>
                    </div>
                    {project.clientPhone && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{project.clientPhone}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Created</p>
                        <p className="font-medium">{getRelativeTimeString(project.timestamp)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Business Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {project.industry && (
                      <div className="flex items-start gap-3">
                        <Building2 className="w-4 h-4 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Industry</p>
                          <p className="font-medium">{project.industry}</p>
                        </div>
                      </div>
                    )}
                    {project.teamSize && (
                      <div className="flex items-start gap-3">
                        <Users className="w-4 h-4 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Team Size</p>
                          <p className="font-medium">{project.teamSize}</p>
                        </div>
                      </div>
                    )}
                    {project.challenges && (
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Challenges</p>
                          <p className="font-medium text-sm">{project.challenges}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Project Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-4 h-4 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Lead Score</p>
                        <p className="font-medium">{project.leadScore}/100</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-4 h-4 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Revenue Value</p>
                        <p className="font-medium">{formatCurrency(project.revenueValue)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status & Phase</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="status" className="text-sm text-muted-foreground">Status</Label>
                      <Select
                        value={project.status}
                        onValueChange={(value) => onStatusChange(project.id, value as Project['status'])}
                      >
                        <SelectTrigger id="status" className="mt-1">
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
                    {project.phase && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phase</p>
                        <p className="font-medium mt-1">{project.phase}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this project..."
                    rows={6}
                    className="resize-none"
                  />
                </CardContent>
              </Card>

              <div className="flex gap-3 flex-wrap">
                <Button className="gap-2">
                  <Play className="w-4 h-4" />
                  Start Building
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.location.href = `mailto:${project.clientEmail}`}
                >
                  <Mail className="w-4 h-4" />
                  Email Client
                </Button>
                <Button variant="outline" className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Mark as Won
                </Button>
                <Button variant="outline" className="gap-2">
                  <XCircle className="w-4 h-4" />
                  Mark as Lost
                </Button>
                <Button variant="outline" className="gap-2">
                  <Archive className="w-4 h-4" />
                  Archive
                </Button>
              </div>
            </TabsContent>

            {/* TAB 2: PROPOSAL */}
            <TabsContent value="proposal" className="p-6 space-y-4 m-0">
              <div className="flex gap-3 mb-4">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => project.proposalHtml && handleCopyToClipboard(project.proposalHtml, "Proposal")}
                  disabled={!project.proposalHtml}
                >
                  <Copy className="w-4 h-4" />
                  Copy Proposal
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.location.href = `mailto:${project.clientEmail}`}
                >
                  <Mail className="w-4 h-4" />
                  Email to Client
                </Button>
              </div>

              {project.proposalHtml ? (
                <Card>
                  <CardContent className="p-6">
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: project.proposalHtml }}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No proposal available for this project</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* TAB 3: BUILD GUIDE */}
            <TabsContent value="build-guide" className="p-6 space-y-4 m-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 max-w-md">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium">Completion</span>
                    <span className="text-sm text-muted-foreground">{buildGuideProgress}%</span>
                  </div>
                  <Progress value={buildGuideProgress} className="h-2" />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="gap-2">
                    <Printer className="w-4 h-4" />
                    Print Guide
                  </Button>
                </div>
              </div>

              {project.buildGuideMarkdown ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {project.buildGuideMarkdown}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No build guide available for this project</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* TAB 4: WORKFLOW JSON */}
            <TabsContent value="workflow" className="p-6 space-y-4 m-0">
              <div className="flex gap-3 mb-4">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => project.workflowJson && handleCopyToClipboard(project.workflowJson, "Workflow JSON")}
                  disabled={!project.workflowJson}
                >
                  <Copy className="w-4 h-4" />
                  Copy JSON
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleDownloadJSON}
                  disabled={!project.workflowJson}
                >
                  <Download className="w-4 h-4" />
                  Download JSON
                </Button>
                <Button variant="outline" className="gap-2" disabled={!project.workflowJson}>
                  <Play className="w-4 h-4" />
                  Import to n8n
                </Button>
              </div>

              {project.workflowJson ? (
                <Card>
                  <CardContent className="p-0">
                    <SyntaxHighlighter
                      language="json"
                      style={vscDarkPlus}
                      showLineNumbers
                      customStyle={{
                        margin: 0,
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                      }}
                    >
                      {JSON.stringify(JSON.parse(project.workflowJson), null, 2)}
                    </SyntaxHighlighter>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileJson className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No workflow JSON available for this project</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* TAB 5: BUILD PROGRESS */}
            <TabsContent value="progress" className="p-6 space-y-6 m-0">
              <BuildProgressTab projectId={project.id} config={config} />
            </TabsContent>
          </div>

          {/* Action Bar */}
          <div className="border-t p-4 flex items-center justify-between bg-background">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <kbd className="px-2 py-1 text-xs bg-muted rounded">Esc</kbd>
              <span>to close</span>
              <kbd className="px-2 py-1 text-xs bg-muted rounded ml-4">←</kbd>
              <kbd className="px-2 py-1 text-xs bg-muted rounded">→</kbd>
              <span>to navigate</span>
            </div>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
