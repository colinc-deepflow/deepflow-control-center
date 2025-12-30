import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  Lightbulb,
  Plus,
  Send,
  Trash2,
  Edit,
  MessageCircle,
  Loader2,
  Sparkles,
  Tag,
  Calendar,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useIdeasHub, useAdvisorChat, Idea } from '@/hooks/useIdeasHub';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const priorityColors = {
  low: 'bg-green-500/10 text-green-600 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  high: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const statusColors = {
  idea: 'bg-purple-500/10 text-purple-600',
  planning: 'bg-blue-500/10 text-blue-600',
  in_progress: 'bg-orange-500/10 text-orange-600',
  completed: 'bg-green-500/10 text-green-600',
  archived: 'bg-gray-500/10 text-gray-600',
};

const IdeaCard = ({ 
  idea, 
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: { 
  idea: Idea;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <Card 
    className={`cursor-pointer transition-all hover:shadow-md ${
      isSelected ? 'ring-2 ring-primary' : ''
    }`}
    onClick={onSelect}
  >
    <CardHeader className="pb-2">
      <div className="flex items-start justify-between">
        <CardTitle className="text-sm font-medium line-clamp-1">{idea.title}</CardTitle>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <CardDescription className="text-xs line-clamp-2">
        {idea.content || 'No description'}
      </CardDescription>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline" className={`text-xs ${priorityColors[idea.priority]}`}>
          {idea.priority}
        </Badge>
        <Badge variant="secondary" className={`text-xs ${statusColors[idea.status]}`}>
          {idea.status.replace('_', ' ')}
        </Badge>
      </div>
      {idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {idea.tags.slice(0, 3).map((tag, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              <Tag className="w-2 h-2 mr-1" />
              {tag}
            </Badge>
          ))}
          {idea.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">+{idea.tags.length - 3}</Badge>
          )}
        </div>
      )}
    </CardContent>
  </Card>
);

export const IdeasHub = () => {
  const { ideas, isLoading, createIdea, updateIdea, deleteIdea } = useIdeasHub();
  const { messages, isLoading: isChatLoading, sendMessage, clearMessages } = useAdvisorChat();
  
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Partial<Idea>>({});
  const [chatInput, setChatInput] = useState('');
  const [filter, setFilter] = useState<'all' | Idea['status']>('all');

  const handleCreateIdea = async () => {
    const newIdea = await createIdea({ 
      title: 'New Idea',
      content: '',
      category: 'general',
    });
    if (newIdea) {
      setEditingIdea(newIdea);
      setIsEditDialogOpen(true);
      toast({ title: 'Idea created', description: 'Add details to your new idea' });
    }
  };

  const handleSaveIdea = async () => {
    if (!editingIdea.id) return;
    const success = await updateIdea(editingIdea.id, editingIdea);
    if (success) {
      setIsEditDialogOpen(false);
      if (selectedIdea?.id === editingIdea.id) {
        setSelectedIdea({ ...selectedIdea, ...editingIdea } as Idea);
      }
      toast({ title: 'Idea updated' });
    }
  };

  const handleDeleteIdea = async (idea: Idea) => {
    const success = await deleteIdea(idea.id);
    if (success) {
      if (selectedIdea?.id === idea.id) {
        setSelectedIdea(null);
        clearMessages();
      }
      toast({ title: 'Idea deleted' });
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const message = chatInput;
    setChatInput('');
    await sendMessage(message, selectedIdea || undefined);
  };

  const filteredIdeas = ideas.filter(idea => 
    filter === 'all' || idea.status === filter
  );

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4 p-4">
      {/* Ideas List */}
      <div className="w-80 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Ideas Hub
          </h2>
          <Button size="sm" onClick={handleCreateIdea} className="gap-1">
            <Plus className="w-4 h-4" />
            New
          </Button>
        </div>

        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="mb-3">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ideas</SelectItem>
            <SelectItem value="idea">Ideas</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredIdeas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No ideas yet</p>
              <p className="text-xs">Click "New" to add your first idea</p>
            </div>
          ) : (
            <div className="space-y-2 pr-2">
              {filteredIdeas.map(idea => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  isSelected={selectedIdea?.id === idea.id}
                  onSelect={() => {
                    setSelectedIdea(idea);
                    clearMessages();
                  }}
                  onEdit={() => {
                    setEditingIdea(idea);
                    setIsEditDialogOpen(true);
                  }}
                  onDelete={() => handleDeleteIdea(idea)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* AI Advisor Chat */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Business Advisor</CardTitle>
              <CardDescription className="text-xs">
                {selectedIdea 
                  ? `Discussing: ${selectedIdea.title}`
                  : 'Chat about ideas, features, and strategy'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator />
        
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">Start a conversation</p>
              <p className="text-sm max-w-md mt-1">
                {selectedIdea 
                  ? `Ask me about "${selectedIdea.title}" - I can help you refine it, plan implementation, or brainstorm related ideas.`
                  : 'Select an idea to discuss, or just chat about new features and business strategy.'
                }
              </p>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => sendMessage("What features should I prioritize for the dashboard?")}
                >
                  Feature priorities
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => sendMessage("Help me brainstorm ways to improve client onboarding")}
                >
                  Client onboarding
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => sendMessage("What automation workflows would be most valuable?")}
                >
                  Automation ideas
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isChatLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <Separator />
        <div className="p-4">
          <div className="flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask your business advisor..."
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              disabled={isChatLoading}
            />
            <Button onClick={handleSendMessage} disabled={isChatLoading || !chatInput.trim()}>
              {isChatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* Edit Idea Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Idea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editingIdea.title || ''}
                onChange={(e) => setEditingIdea(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Idea title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editingIdea.content || ''}
                onChange={(e) => setEditingIdea(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Describe your idea..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select 
                  value={editingIdea.priority || 'medium'} 
                  onValueChange={(v) => setEditingIdea(prev => ({ ...prev, priority: v as Idea['priority'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={editingIdea.status || 'idea'} 
                  onValueChange={(v) => setEditingIdea(prev => ({ ...prev, status: v as Idea['status'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Input
                value={editingIdea.category || ''}
                onChange={(e) => setEditingIdea(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., feature, workflow, integration"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveIdea}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
