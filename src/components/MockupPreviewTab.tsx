import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  Loader2, 
  Download, 
  Copy, 
  RefreshCw,
  Palette,
  Layout,
  Image,
  MessageSquare,
  ChevronRight,
  Check,
  History,
  Send,
} from 'lucide-react';
import { useMockupGenerator, MockupSpec, StyleVariation, MockupPage, MockupComponent } from '@/hooks/useMockupGenerator';

interface MockupPreviewTabProps {
  project: {
    clientName: string;
    industry?: string;
    teamSize?: string;
    currentChallenges?: string;
    currentProcess?: string;
    desiredOutcomes?: string;
    notes?: string;
    proposalHtml?: string;
  };
}

const ComponentPreview = ({ component }: { component: MockupComponent }) => {
  const componentStyles: Record<string, string> = {
    hero: 'bg-gradient-to-r from-primary/20 to-primary/5 min-h-[120px]',
    features: 'bg-muted/50 min-h-[100px]',
    pricing: 'bg-accent/10 min-h-[100px]',
    testimonials: 'bg-secondary/20 min-h-[80px]',
    cta: 'bg-primary/10 min-h-[60px]',
    contact: 'bg-muted min-h-[80px]',
    stats: 'bg-accent/5 min-h-[60px]',
    gallery: 'bg-muted/30 min-h-[100px]',
    faq: 'bg-secondary/10 min-h-[80px]',
    footer: 'bg-foreground/5 min-h-[60px]',
    navigation: 'bg-background border-b min-h-[40px]',
  };

  return (
    <div className={`rounded-lg p-4 ${componentStyles[component.type] || 'bg-muted'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="text-xs capitalize">
          {component.type}
        </Badge>
      </div>
      <h4 className="font-semibold text-sm">{component.title}</h4>
      {component.subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{component.subtitle}</p>
      )}
    </div>
  );
};

const PagePreview = ({ page }: { page: MockupPage }) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">{page.name}</CardTitle>
            <CardDescription className="text-xs">{page.path}</CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            {page.components.length} components
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {page.components.map((component, idx) => (
          <ComponentPreview key={idx} component={component} />
        ))}
      </CardContent>
    </Card>
  );
};

const StyleCard = ({ 
  style, 
  isSelected, 
  onSelect 
}: { 
  style: StyleVariation; 
  isSelected: boolean;
  onSelect: () => void;
}) => {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold capitalize">{style.name}</h4>
          {isSelected && <Check className="w-4 h-4 text-primary" />}
        </div>
        <div className="flex gap-2 mb-3">
          <div 
            className="w-8 h-8 rounded-full border-2 border-background shadow-sm" 
            style={{ backgroundColor: style.primaryColor }}
            title="Primary"
          />
          <div 
            className="w-8 h-8 rounded-full border-2 border-background shadow-sm" 
            style={{ backgroundColor: style.secondaryColor }}
            title="Secondary"
          />
          <div 
            className="w-8 h-8 rounded-full border-2 border-background shadow-sm" 
            style={{ backgroundColor: style.accentColor }}
            title="Accent"
          />
        </div>
        <p className="text-xs text-muted-foreground">{style.description}</p>
        <p className="text-xs text-muted-foreground mt-1">Font: {style.fontFamily}</p>
      </CardContent>
    </Card>
  );
};

export const MockupPreviewTab = ({ project }: MockupPreviewTabProps) => {
  const { generateMockup, isGenerating, error, revisions, addFeedback } = useMockupGenerator();
  const [mockupSpec, setMockupSpec] = useState<MockupSpec | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [activeView, setActiveView] = useState<'styles' | 'pages' | 'images' | 'flows'>('styles');

  const handleGenerate = async (stylePreference?: string) => {
    const result = await generateMockup(project, stylePreference);
    if (result) {
      setMockupSpec(result);
      setSelectedStyle(null);
      toast({
        title: "Mockup Generated!",
        description: `Created ${result.pages.length} pages with ${result.styleVariations.length} style options`,
      });
    } else if (error) {
      toast({
        title: "Generation Failed",
        description: error,
        variant: "destructive",
      });
    }
  };

  const handleSubmitFeedback = () => {
    if (!feedback.trim() || revisions.length === 0) return;
    
    const latestRevision = revisions[revisions.length - 1];
    addFeedback(latestRevision.id, feedback);
    
    toast({
      title: "Feedback Saved",
      description: "Your feedback has been recorded. Click 'Regenerate' to apply changes.",
    });
    setFeedback('');
  };

  const handleCopy = () => {
    if (!mockupSpec) return;
    navigator.clipboard.writeText(JSON.stringify(mockupSpec, null, 2));
    toast({
      title: "Copied!",
      description: "Mockup specification copied to clipboard",
    });
  };

  const handleDownload = () => {
    if (!mockupSpec) return;
    const blob = new Blob([JSON.stringify(mockupSpec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.clientName.replace(/\s+/g, '_')}_mockup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!mockupSpec) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Layout className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Generate Client Mockup</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          Create a live mockup preview from the project proposal. The AI will generate 
          multiple style variations and page layouts for client review.
        </p>
        <Button 
          onClick={() => handleGenerate()} 
          disabled={isGenerating}
          size="lg"
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Mockup...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Mockup Preview
            </>
          )}
        </Button>
        {error && (
          <p className="text-destructive text-sm mt-4">{error}</p>
        )}
        
        {revisions.length > 0 && (
          <div className="mt-8 w-full max-w-md">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Previous Revisions</span>
            </div>
            <div className="space-y-2">
              {revisions.map((rev, idx) => (
                <Card 
                  key={rev.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setMockupSpec(rev.mockup)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Revision {idx + 1}</p>
                      <p className="text-xs text-muted-foreground">
                        {rev.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{mockupSpec.projectName}</h3>
          <p className="text-sm text-muted-foreground">{mockupSpec.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1">
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1">
            <Copy className="w-4 h-4" />
            Copy
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleGenerate(selectedStyle || undefined)}
            disabled={isGenerating}
            className="gap-1"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Regenerate
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b">
        <div className="flex gap-1 p-2">
          <Button 
            variant={activeView === 'styles' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => setActiveView('styles')}
            className="gap-1"
          >
            <Palette className="w-4 h-4" />
            Styles ({mockupSpec.styleVariations.length})
          </Button>
          <Button 
            variant={activeView === 'pages' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => setActiveView('pages')}
            className="gap-1"
          >
            <Layout className="w-4 h-4" />
            Pages ({mockupSpec.pages.length})
          </Button>
          <Button 
            variant={activeView === 'images' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => setActiveView('images')}
            className="gap-1"
          >
            <Image className="w-4 h-4" />
            Images ({mockupSpec.suggestedImages?.length || 0})
          </Button>
          <Button 
            variant={activeView === 'flows' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => setActiveView('flows')}
            className="gap-1"
          >
            <ChevronRight className="w-4 h-4" />
            Flows ({mockupSpec.userFlows?.length || 0})
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {activeView === 'styles' && (
            <div className="space-y-4">
              <h4 className="font-medium">Choose a Style Direction</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockupSpec.styleVariations.map((style) => (
                  <StyleCard
                    key={style.name}
                    style={style}
                    isSelected={selectedStyle === style.name}
                    onSelect={() => setSelectedStyle(style.name)}
                  />
                ))}
              </div>
              {selectedStyle && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm">
                    <strong>Selected:</strong> {selectedStyle} style. 
                    Click "Regenerate" to refine the mockup with this style preference.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeView === 'pages' && (
            <div className="space-y-4">
              <h4 className="font-medium">Page Layouts</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {mockupSpec.pages.map((page, idx) => (
                  <PagePreview key={idx} page={page} />
                ))}
              </div>
            </div>
          )}

          {activeView === 'images' && (
            <div className="space-y-4">
              <h4 className="font-medium">Suggested Images</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockupSpec.suggestedImages?.map((img, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center mb-3">
                        <Image className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">{img.location}</p>
                      <p className="text-xs text-muted-foreground mt-1">{img.description}</p>
                      <Badge variant="outline" className="mt-2 text-xs">{img.style}</Badge>
                    </CardContent>
                  </Card>
                )) || (
                  <p className="text-muted-foreground">No image suggestions available</p>
                )}
              </div>
            </div>
          )}

          {activeView === 'flows' && (
            <div className="space-y-4">
              <h4 className="font-medium">User Flows</h4>
              <div className="space-y-4">
                {mockupSpec.userFlows?.map((flow, idx) => (
                  <Card key={idx}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">{flow.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {flow.steps.map((step, stepIdx) => (
                          <div key={stepIdx} className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {stepIdx + 1}. {step}
                            </Badge>
                            {stepIdx < flow.steps.length - 1 && (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )) || (
                  <p className="text-muted-foreground">No user flows defined</p>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Feedback Section */}
      <Separator />
      <div className="p-4 bg-muted/30">
        <div className="flex items-start gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground mt-1" />
          <span className="text-sm font-medium">Client Feedback</span>
        </div>
        <div className="flex gap-2">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Enter client feedback or requested changes..."
            className="min-h-[60px] resize-none"
          />
          <Button 
            onClick={handleSubmitFeedback}
            disabled={!feedback.trim()}
            className="gap-1"
          >
            <Send className="w-4 h-4" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};
