import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Bot,
  Sparkles,
  Loader2,
  Layout,
  Eye,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "@/hooks/use-toast";
import { BuildProgressTab } from "./BuildProgressTab";
import { ProjectBossChat } from "./ProjectBossChat";
import { ClientDashboardTab } from "./ClientDashboardTab";
import { MockupPreviewTab } from "./MockupPreviewTab";
import { useWorkflowBuilder } from "@/hooks/useWorkflowBuilder";

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
  const [expandedChallenges, setExpandedChallenges] = useState(false);
  const [generatedWorkflow, setGeneratedWorkflow] = useState<string | null>(null);
  const { generateWorkflow, isGenerating, error: workflowError } = useWorkflowBuilder();

  useEffect(() => {
    if (project) {
      setNotes(project.notes || '');
      setGeneratedWorkflow(null); // Reset when project changes
    }
  }, [project]);

  if (!project) return null;

  // Use generated workflow if available, otherwise use project's workflow
  const currentWorkflowJson = generatedWorkflow || project.workflowJson;

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleDownloadJSON = () => {
    if (!currentWorkflowJson) return;
    const blob = new Blob([currentWorkflowJson], { type: 'application/json' });
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

  const handleGenerateWorkflow = async () => {
    const workflowContext = {
      clientName: project.clientName,
      industry: project.industry,
      teamSize: project.teamSize,
      currentChallenges: project.currentChallenges,
      currentProcess: project.currentProcess,
      desiredOutcomes: project.desiredOutcomes,
      notes: project.notes,
    };

    const result = await generateWorkflow(workflowContext);
    
    if (result) {
      setGeneratedWorkflow(result);
      toast({
        title: "Workflow Generated!",
        description: "Your n8n workflow is ready to download",
      });
    } else if (workflowError) {
      toast({
        title: "Generation Failed",
        description: workflowError,
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
    } else if (e.key === 'ArrowLeft') {
      const tabs = ['overview', 'proposal', 'build-guide', 'workflow', 'progress', 'boss', 'client-dashboard', 'mockup-preview'];
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    } else if (e.key === 'ArrowRight') {
      const tabs = ['overview', 'proposal', 'build-guide', 'workflow', 'progress', 'boss', 'client-dashboard', 'mockup-preview'];
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      }
    }
  };

  const projectContext = {
    clientName: project.clientName,
    status: project.status,
    appDescription: project.notes || '',
    revenueValue: project.revenueValue,
  };

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
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Projects &gt; {project.clientName} &gt; {activeTab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </DialogDescription>
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
            <TabsTrigger value="boss" className="gap-2">
              <Bot className="w-4 h-4" />
              Project Boss
            </TabsTrigger>
            <TabsTrigger value="client-dashboard" className="gap-2">
              <Layout className="w-4 h-4" />
              Client Dashboard
            </TabsTrigger>
            <TabsTrigger value="mockup-preview" className="gap-2">
              <Eye className="w-4 h-4" />
              Mockup Preview
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview" className="p-6 space-y-4 mt-0">
              {/* Contact Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-primary">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.contactName && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">👤 Contact Person</p>
                      <p className="text-base font-semibold">{project.contactName}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">🏢 Business Name</p>
                    <p className="text-base font-semibold">{project.clientName}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">📧 Email</p>
                    <a 
                      href={`mailto:${project.clientEmail}`}
                      className="text-base text-primary hover:underline font-medium"
                    >
                      {project.clientEmail}
                    </a>
                  </div>
                  
                  {project.phoneNumber && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">📱 Phone</p>
                      <a 
                        href={`tel:${project.phoneNumber}`}
                        className="text-base text-primary hover:underline font-medium"
                      >
                        {project.phoneNumber}
                      </a>
                    </div>
                  )}
                  
                  {project.industry && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">🏭 Industry</p>
                      <p className="text-base">{project.industry}</p>
                    </div>
                  )}
                  
                  {project.teamSize && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">👥 Team Size</p>
                      <p className="text-base">{project.teamSize}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Project Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-primary">Project Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-2">📊 Status</p>
                    <Select
                      value={project.status}
                      onValueChange={(value) => onStatusChange(project.id, value as Project['status'])}
                    >
                      <SelectTrigger className="w-full">
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
                  
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-2">⭐ Lead Score</p>
                    <div className="flex items-center gap-3">
                      <Progress value={project.leadScore} className="h-2 flex-1" />
                      <span className="text-base font-semibold">{project.leadScore}/100</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">💰 Revenue Value</p>
                    <p className="text-3xl font-bold text-accent">{formatCurrency(project.revenueValue)}</p>
                  </div>
                  
                  {project.phase && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">📍 Current Phase</p>
                      <p className="text-base">{project.phase}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Business Context Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-primary">Business Context</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {project.currentChallenges && (
                    <div>
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        🎯 Current Challenges
                      </p>
                      <div className="text-sm leading-relaxed bg-muted p-3 rounded border">
                        {expandedChallenges || project.currentChallenges.length <= 200
                          ? project.currentChallenges
                          : `${project.currentChallenges.substring(0, 200)}...`}
                      </div>
                      {project.currentChallenges.length > 200 && (
                        <button
                          onClick={() => setExpandedChallenges(!expandedChallenges)}
                          className="mt-2 text-xs text-primary underline"
                        >
                          {expandedChallenges ? 'Show Less' : 'View Full'}
                        </button>
                      )}
                    </div>
                  )}
                  
                  {project.currentProcess && (
                    <div>
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        🔧 Current Process
                      </p>
                      <div className="text-sm leading-relaxed bg-muted p-3 rounded border">
                        {project.currentProcess.length <= 200
                          ? project.currentProcess
                          : `${project.currentProcess.substring(0, 200)}...`}
                      </div>
                    </div>
                  )}
                  
                  {project.desiredOutcomes && (
                    <div>
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        ✨ Desired Outcomes
                      </p>
                      <div className="text-sm leading-relaxed bg-muted p-3 rounded border">
                        {project.desiredOutcomes.length <= 200
                          ? project.desiredOutcomes
                          : `${project.desiredOutcomes.substring(0, 200)}...`}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-primary">📝 Internal Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this project..."
                    rows={5}
                    className="resize-vertical"
                  />
                  <p className="text-xs text-muted-foreground mt-2">Auto-saves on blur</p>
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
            <TabsContent value="proposal" className="p-0 mt-0">
              {project.proposalHtml ? (
                <>
                  {/* Action Bar */}
                  <div className="flex gap-3 p-4 border-b bg-muted/30">
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => handleCopyToClipboard(project.proposalHtml || '', "Proposal HTML")}
                    >
                      <Copy className="w-4 h-4" />
                      Copy HTML
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        if (project.proposalHtml) {
                          const blob = new Blob([project.proposalHtml], { type: 'text/html' });
                          const url = URL.createObjectURL(blob);
                          window.open(url, '_blank');
                        }
                      }}
                    >
                      <FileCode className="w-4 h-4" />
                      Open in New Tab
                    </Button>
                    <Button
                      className="gap-2"
                      onClick={() => {
                        const subject = encodeURIComponent(`Your Proposal - ${project.clientName}`);
                        window.location.href = `mailto:${project.clientEmail}?subject=${subject}`;
                      }}
                    >
                      <Mail className="w-4 h-4" />
                      Email to Client
                    </Button>
                  </div>
                  
                  {/* Proposal Content - Rendered HTML */}
                  <div className="bg-background p-6">
                    <div 
                      dangerouslySetInnerHTML={{ __html: project.proposalHtml }}
                      className="max-w-full"
                    />
                  </div>
                  
                  {/* Info Footer */}
                  <div className="p-3 border-t bg-muted/30 text-xs text-muted-foreground">
                    This is the exact proposal that was sent to {project.contactName || project.clientName} ({project.clientEmail})
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-12">
                  <div className="text-center">
                    <FileCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No proposal available for this project</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 3: BUILD GUIDE */}
            <TabsContent value="build-guide" className="p-0 mt-0">
              {project.buildGuideMarkdown ? (
                <>
                  {/* Action Bar */}
                  <div className="flex gap-3 p-4 border-b bg-muted/30">
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => handleCopyToClipboard(project.buildGuideMarkdown || '', "Build Guide")}
                    >
                      <Copy className="w-4 h-4" />
                      Copy Text
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => window.print()}
                    >
                      <Printer className="w-4 h-4" />
                      Print Guide
                    </Button>
                  </div>
                  
                  {/* Build Guide Content */}
                  <div className="bg-background p-8">
                    <div className="max-w-4xl mx-auto">
                      <div className="prose prose-sm lg:prose-base max-w-none dark:prose-invert">
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
                                  customStyle={{
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                  }}
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
                    </div>
                  </div>
                  
                  {/* Info Footer */}
                  <div className="p-3 border-t bg-muted/30 text-xs text-muted-foreground">
                    Implementation guide for {project.clientName}'s automation project
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-12">
                  <div className="text-center">
                    <FileCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-base text-muted-foreground font-medium mb-2">No build guide available</p>
                    <p className="text-sm text-muted-foreground">Documentation will appear here once the proposal is generated</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 4: WORKFLOW JSON */}
            <TabsContent value="workflow" className="p-0 mt-0">
              {currentWorkflowJson ? (
                <>
                  {/* Metadata Header */}
                  <div className="p-5 bg-muted/30 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-3">
                          {(() => {
                            try {
                              const parsed = JSON.parse(currentWorkflowJson);
                              return parsed.name || 'Automation Workflow';
                            } catch {
                              return 'Automation Workflow';
                            }
                          })()}
                        </h3>
                        <div className="flex gap-6 text-sm text-muted-foreground">
                          <div>
                            <span className="font-semibold">Nodes:</span>{' '}
                            {(() => {
                              try {
                                const parsed = JSON.parse(currentWorkflowJson);
                                return parsed.nodes?.length || 0;
                              } catch {
                                return 0;
                              }
                            })()}
                          </div>
                          <div>
                            <span className="font-semibold">Connections:</span>{' '}
                            {(() => {
                              try {
                                const parsed = JSON.parse(currentWorkflowJson);
                                const connections = parsed.connections || {};
                                return Object.values(connections).flat().length;
                              } catch {
                                return 0;
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                      {generatedWorkflow && (
                        <Badge variant="secondary" className="gap-1">
                          <Sparkles className="w-3 h-3" />
                          AI Generated
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex gap-3 p-4 border-b bg-background">
                    <Button 
                      className="gap-2"
                      onClick={handleDownloadJSON}
                    >
                      <Download className="w-4 h-4" />
                      Download JSON
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => handleCopyToClipboard(currentWorkflowJson || '', "Workflow JSON")}
                    >
                      <Copy className="w-4 h-4" />
                      Copy to Clipboard
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={handleGenerateWorkflow}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {isGenerating ? 'Generating...' : 'Regenerate'}
                    </Button>
                  </div>
                  
                  {/* JSON Display */}
                  <div className="bg-[#1e1e1e]">
                    <SyntaxHighlighter
                      language="json"
                      style={vscDarkPlus}
                      showLineNumbers
                      wrapLines
                      lineNumberStyle={{
                        minWidth: '3em',
                        paddingRight: '1em',
                        color: '#6b7280',
                        userSelect: 'none',
                      }}
                      customStyle={{
                        margin: 0,
                        padding: '1.5rem',
                        fontSize: '0.8125rem',
                        backgroundColor: 'transparent',
                      }}
                    >
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(currentWorkflowJson), null, 2);
                        } catch (error) {
                          return currentWorkflowJson;
                        }
                      })()}
                    </SyntaxHighlighter>
                  </div>
                  
                  {/* Instructions Footer */}
                  <div className="p-4 border-t bg-muted/30">
                    <p className="text-sm font-semibold mb-2 text-foreground">How to import to n8n:</p>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Download the JSON file using the button above</li>
                      <li>Open your n8n instance</li>
                      <li>Click "Add workflow" → "Import from File"</li>
                      <li>Select the downloaded JSON file</li>
                      <li>Configure credentials and test the workflow</li>
                    </ol>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-12">
                  <div className="text-center">
                    <FileJson className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-base text-muted-foreground font-medium mb-2">No workflow JSON available</p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Generate an n8n workflow based on the client's challenges and needs
                    </p>
                    <Button
                      className="gap-2"
                      onClick={handleGenerateWorkflow}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {isGenerating ? 'Generating Workflow...' : 'Generate Workflow'}
                    </Button>
                    {workflowError && (
                      <p className="text-sm text-destructive mt-4">{workflowError}</p>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 5: BUILD PROGRESS */}
            <TabsContent value="progress" className="p-6 space-y-6 mt-0">
              <BuildProgressTab projectId={project.id} config={config} />
            </TabsContent>

            {/* TAB 6: PROJECT BOSS */}
            <TabsContent value="boss" className="p-0 mt-0 h-full">
              <div className="h-[calc(90vh-200px)]">
                <ProjectBossChat project={projectContext} />
              </div>
            </TabsContent>

            {/* TAB 7: CLIENT DASHBOARD */}
            <TabsContent value="client-dashboard" className="p-0 mt-0 h-full">
              <div className="h-[calc(90vh-200px)]">
                <ClientDashboardTab project={project} />
              </div>
            </TabsContent>

            {/* TAB 8: MOCKUP PREVIEW */}
            <TabsContent value="mockup-preview" className="p-0 mt-0 h-full">
              <div className="h-[calc(90vh-200px)]">
                <MockupPreviewTab project={project} />
              </div>
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
