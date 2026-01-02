import { useState, useEffect } from "react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { SettingsModal } from "@/components/SettingsModal";
import { DashboardHeader } from "@/components/DashboardHeader";
import { StatsCards } from "@/components/StatsCards";
import { FilterButtons } from "@/components/FilterButtons";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectDetailView } from "@/components/ProjectDetailView";
import { AgentChat } from "@/components/AgentChat";
import { IdeasHub } from "@/components/IdeasHub";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  loadConfig,
  saveConfig,
  updateProjectStatus,
  type GoogleSheetsConfig,
} from "@/lib/googleSheets";
import {
  fetchProjects as fetchBackendProjects,
  healthCheck,
  type Project,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Bot, X, Lightbulb, LayoutDashboard } from "lucide-react";

const Index = () => {
  // Auto-load the hardcoded config immediately (for Google Sheets fallback)
  const [config, setConfig] = useState<GoogleSheetsConfig | null>(() => loadConfig());
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAgentChat, setShowAgentChat] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<'projects' | 'ideas'>('projects');
  const [autoRefresh, setAutoRefresh] = useState(() => {
    const saved = localStorage.getItem('autoRefresh');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [newProjectIds, setNewProjectIds] = useState<Set<string>>(new Set());
  const [hasNewProjects, setHasNewProjects] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const { toast } = useToast();

  // Check backend connection on mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // Fetch projects when backend is connected or config is available
  useEffect(() => {
    if (backendConnected || config) {
      loadProjects();
    }
  }, [backendConnected, config]);

  const checkBackendConnection = async () => {
    try {
      await healthCheck();
      setBackendConnected(true);
      console.log('✅ Backend connected successfully');
    } catch (error) {
      console.log('⚠️ Backend not available, will use Google Sheets if configured');
      setBackendConnected(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if ((!backendConnected && !config) || !autoRefresh) return;
    
    const interval = setInterval(() => {
      loadProjects(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [backendConnected, config, autoRefresh]);

  // Clear new project indicators after 10 seconds
  useEffect(() => {
    if (newProjectIds.size === 0) return;

    const timeout = setTimeout(() => {
      setNewProjectIds(new Set());
      setHasNewProjects(false);
    }, 10000);

    return () => clearTimeout(timeout);
  }, [newProjectIds]);

  const loadProjects = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      let data: Project[];

      // Try backend API first if connected
      if (backendConnected) {
        try {
          data = await fetchBackendProjects();
          console.log('✅ Loaded projects from FastAPI backend');
        } catch (backendError) {
          console.error('Backend fetch failed, trying Google Sheets fallback:', backendError);

          // Fallback to Google Sheets if backend fails
          if (config) {
            const { fetchProjects: fetchGoogleSheets } = await import('@/lib/googleSheets');
            data = await fetchGoogleSheets(config);
            console.log('✅ Loaded projects from Google Sheets fallback');
          } else {
            throw new Error('Backend unavailable and no Google Sheets config');
          }
        }
      } else if (config) {
        // Use Google Sheets if backend is not connected
        const { fetchProjects: fetchGoogleSheets } = await import('@/lib/googleSheets');
        data = await fetchGoogleSheets(config);
        console.log('✅ Loaded projects from Google Sheets');
      } else {
        throw new Error('No backend connection and no Google Sheets config');
      }

      // Check for new projects
      if (silent && projects.length > 0) {
        const existingIds = new Set(projects.map(p => p.id));
        const newProjects = data.filter(p => !existingIds.has(p.id));

        if (newProjects.length > 0) {
          const newIds = new Set(newProjects.map(p => p.id));
          setNewProjectIds(newIds);
          setHasNewProjects(true);

          // Show toast for each new project
          newProjects.forEach(project => {
            toast({
              title: "New project received",
              description: `${project.clientName} - ${project.clientEmail}`,
            });
          });
        }
      }

      setProjects(data);
      if (!silent) {
        toast({
          title: "Projects loaded",
          description: `Loaded ${data.length} projects ${backendConnected ? 'from backend' : 'from Google Sheets'}`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error loading projects",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSaveConfig = (newConfig: GoogleSheetsConfig, autoRefreshEnabled: boolean) => {
    saveConfig(newConfig);
    setConfig(newConfig);
    setAutoRefresh(autoRefreshEnabled);
    localStorage.setItem('autoRefresh', JSON.stringify(autoRefreshEnabled));
    toast({
      title: "Configuration saved",
      description: "Your Google Sheets connection is configured",
    });
  };

  const handleStatusChange = async (projectId: string, newStatus: Project['status']) => {
    if (!config) return;

    try {
      await updateProjectStatus(config, projectId, newStatus);
      setProjects(projects.map(p => 
        p.id === projectId ? { ...p, status: newStatus } : p
      ));
      toast({
        title: "Status updated",
        description: `Project status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error updating status",
        description: "Failed to update project status",
        variant: "destructive",
      });
    }
  };

  // Calculate stats
  const filteredProjects = projects.filter(p => 
    selectedFilter === 'all' || p.status === selectedFilter
  );

  const totalRevenue = projects.reduce((sum, p) => sum + p.revenueValue, 0);
  const deployedCount = projects.filter(p => p.status === 'Deployed' || p.status === 'Live').length;
  const conversionRate = projects.length > 0 ? Math.round((deployedCount / projects.length) * 100) : 0;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newThisWeek = projects.filter(p => new Date(p.timestamp) > oneWeekAgo).length;

  const projectCounts = {
    all: projects.length,
    newLeads: projects.filter(p => p.status === 'New Lead').length,
    building: projects.filter(p => p.status === 'Building').length,
    deployed: projects.filter(p => p.status === 'Deployed' || p.status === 'Live').length,
  };

  // Only show welcome screen if both backend and Google Sheets are unavailable
  if (!backendConnected && !config) {
    return (
      <>
        <WelcomeScreen onGetStarted={() => setShowSettings(true)} />
        <SettingsModal
          open={showSettings}
          onOpenChange={setShowSettings}
          onSave={handleSaveConfig}
          initialConfig={config}
          autoRefresh={autoRefresh}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        totalProjects={projects.length}
        pipelineValue={totalRevenue}
        newThisWeek={newThisWeek}
        hasNewProjects={hasNewProjects}
        onSettingsClick={() => setShowSettings(true)}
      />

      <Tabs value={activeMainTab} onValueChange={(v) => setActiveMainTab(v as 'projects' | 'ideas')} className="w-full">
        <div className="container mx-auto px-6 pt-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="projects" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="ideas" className="gap-2">
              <Lightbulb className="w-4 h-4" />
              Ideas Hub
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="projects" className="mt-0">
          <main className="container mx-auto px-6 py-8 space-y-8">
            <StatsCards
              totalProjects={projects.length}
              totalRevenue={totalRevenue}
              conversionRate={conversionRate}
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <FilterButtons
                selectedFilter={selectedFilter}
                onFilterChange={setSelectedFilter}
                projectCounts={projectCounts}
              />

              <Button
                variant="outline"
                size="sm"
                onClick={() => loadProjects()}
                disabled={loading}
                className="rounded-full"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No projects found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isNew={newProjectIds.has(project.id)}
                    onClick={() => setSelectedProject(project)}
                  />
                ))}
              </div>
            )}
          </main>
        </TabsContent>

        <TabsContent value="ideas" className="mt-0">
          <IdeasHub />
        </TabsContent>
      </Tabs>

      <SettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        onSave={handleSaveConfig}
        initialConfig={config}
        autoRefresh={autoRefresh}
      />

      <ProjectDetailView
        project={selectedProject}
        open={!!selectedProject}
        onOpenChange={(open) => !open && setSelectedProject(null)}
        onStatusChange={handleStatusChange}
        config={config!}
      />

      {/* Floating Agent Chat Button */}
      <Button
        onClick={() => setShowAgentChat(!showAgentChat)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 ${
          showAgentChat ? 'bg-muted hover:bg-muted/80' : 'bg-primary hover:bg-primary/90'
        }`}
        size="icon"
      >
        {showAgentChat ? (
          <X className="w-6 h-6" />
        ) : (
          <Bot className="w-6 h-6" />
        )}
      </Button>

      {/* Agent Chat Panel */}
      {showAgentChat && (
        <div className="fixed bottom-24 right-6 w-[420px] max-w-[calc(100vw-3rem)] z-40 animate-in slide-in-from-bottom-4 duration-300">
          <AgentChat projects={projects} />
        </div>
      )}
    </div>
  );
};

export default Index;
