import { useEffect, useState } from 'react';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { 
  Task, 
  Comment, 
  GoogleSheetsConfig, 
  fetchTasks, 
  fetchComments, 
  createTask, 
  updateTask, 
  deleteTask, 
  createComment,
  createDefaultTasks 
} from '@/lib/googleSheets';

interface BuildProgressTabProps {
  projectId: string;
  config: GoogleSheetsConfig;
}

export const BuildProgressTab = ({ projectId, config }: BuildProgressTabProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [sortBy, setSortBy] = useState<'dueDate' | 'status' | 'created'>('dueDate');
  const [filterBy, setFilterBy] = useState<'all' | 'To Do' | 'In Progress' | 'Done' | 'overdue'>('all');
  
  // New task form
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<Task['status']>('To Do');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date>();
  const [newTaskEstimated, setNewTaskEstimated] = useState('');
  
  // Quick log hours
  const [selectedTaskForLog, setSelectedTaskForLog] = useState('');
  const [hoursToLog, setHoursToLog] = useState('');
  
  // New comment
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksData, commentsData] = await Promise.all([
        fetchTasks(config, projectId),
        fetchComments(config, projectId)
      ]);
      setTasks(tasksData);
      setComments(commentsData);
    } catch (error) {
      toast({
        title: 'Error loading data',
        description: 'Failed to load tasks and comments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const totalHoursLogged = tasks.reduce((sum, t) => sum + t.hoursLogged, 0);
  const totalEstimated = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const variance = totalHoursLogged - totalEstimated;

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'To Do': return 'bg-muted text-muted-foreground';
      case 'In Progress': return 'bg-primary text-primary-foreground';
      case 'Done': return 'bg-success text-success-foreground';
      case 'Blocked': return 'bg-destructive text-destructive-foreground';
    }
  };

  const handleToggleTask = async (task: Task) => {
    const newStatus: Task['status'] = task.status === 'Done' ? 'To Do' : 'Done';
    const updatedTask: Task = { ...task, status: newStatus };
    
    // Optimistic update
    setTasks(tasks.map(t => t.taskId === task.taskId ? updatedTask : t) as Task[]);
    
    try {
      await updateTask(config, updatedTask);
      toast({ title: 'Task updated', description: `Task marked as ${newStatus}` });
    } catch (error) {
      setTasks(tasks); // Revert on error
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskName.trim()) return;

    const newTask: Task = {
      taskId: `${Date.now()}`,
      projectId,
      taskName: newTaskName,
      status: newTaskStatus,
      dueDate: newTaskDueDate ? format(newTaskDueDate, 'yyyy-MM-dd') : '',
      hoursLogged: 0,
      estimatedHours: parseFloat(newTaskEstimated) || 0,
    };

    setTasks([...tasks, newTask]);
    setShowAddTask(false);
    setNewTaskName('');
    setNewTaskStatus('To Do');
    setNewTaskDueDate(undefined);
    setNewTaskEstimated('');

    try {
      await createTask(config, newTask);
      toast({ title: 'Task created' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create task', variant: 'destructive' });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(tasks.filter(t => t.taskId !== taskId));
    try {
      await deleteTask(config, taskId);
      toast({ title: 'Task deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
    }
  };

  const handleLogHours = async () => {
    if (!selectedTaskForLog || !hoursToLog) return;

    const task = tasks.find(t => t.taskId === selectedTaskForLog);
    if (!task) return;

    const updatedTask = { 
      ...task, 
      hoursLogged: task.hoursLogged + parseFloat(hoursToLog) 
    };

    setTasks(tasks.map(t => t.taskId === task.taskId ? updatedTask : t));
    setSelectedTaskForLog('');
    setHoursToLog('');

    try {
      await updateTask(config, updatedTask);
      toast({ title: 'Hours logged', description: `${hoursToLog} hours added` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to log hours', variant: 'destructive' });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      projectId,
      timestamp: new Date().toISOString(),
      author: 'You',
      commentText: newComment,
    };

    setComments([comment, ...comments]);
    setNewComment('');

    try {
      await createComment(config, comment);
      toast({ title: 'Comment added' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add comment', variant: 'destructive' });
    }
  };

  const handleGenerateDefaultTasks = async () => {
    try {
      await createDefaultTasks(config, projectId);
      await loadData();
      toast({ title: 'Default tasks created', description: '12 tasks added to your project' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create default tasks', variant: 'destructive' });
    }
  };

  const getFilteredTasks = () => {
    let filtered = [...tasks];

    // Apply filter
    if (filterBy !== 'all') {
      if (filterBy === 'overdue') {
        const today = new Date();
        filtered = filtered.filter(t => {
          if (!t.dueDate) return false;
          return new Date(t.dueDate) < today && t.status !== 'Done';
        });
      } else {
        filtered = filtered.filter(t => t.status === filterBy);
      }
    }

    // Apply sort
    filtered.sort((a, b) => {
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

    return filtered;
  };

  const getDaysUntil = (dueDate: string) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days away`;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const filteredTasks = getFilteredTasks();

  return (
    <div className="space-y-8">
      {/* Info Banner */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-primary mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-foreground mb-1">Tasks Stored Locally</h4>
            <p className="text-sm text-muted-foreground">
              Tasks and comments are stored in your browser's local storage. They won't appear in Google Sheets, but will persist across sessions on this device.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Project Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Project Progress</h3>
          {tasks.length === 0 && (
            <Button onClick={handleGenerateDefaultTasks} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Generate Default Tasks
            </Button>
          )}
        </div>
        
        <Progress value={progressPercent} className="h-3" />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Tasks</p>
            <p className="text-2xl font-bold">{totalTasks}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-success">{completedTasks}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-primary">{inProgressTasks}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Progress</p>
            <p className="text-2xl font-bold">{progressPercent.toFixed(0)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Hours Logged</p>
            <p className="text-xl font-semibold">{totalHoursLogged.toFixed(1)}h</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Estimated</p>
            <p className="text-xl font-semibold">{totalEstimated.toFixed(1)}h</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Variance</p>
            <p className={cn("text-xl font-semibold", variance > 0 ? "text-destructive" : "text-success")}>
              {variance > 0 ? '+' : ''}{variance.toFixed(1)}h
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Task List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-lg font-semibold">Tasks</h3>
          
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Sort by Date</SelectItem>
                <SelectItem value="status">Sort by Status</SelectItem>
                <SelectItem value="created">Sort by Created</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBy} onValueChange={(v: any) => setFilterBy(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="To Do">To Do</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => setShowAddTask(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Add Task Form */}
        {showAddTask && (
          <div className="p-4 border rounded-lg space-y-4 bg-card">
            <h4 className="font-semibold">New Task</h4>
            <Input
              placeholder="Task name"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-4">
              <Select value={newTaskStatus} onValueChange={(v: any) => setNewTaskStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="To Do">To Do</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    {newTaskDueDate ? format(newTaskDueDate, 'MMM dd') : 'Due date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={newTaskDueDate}
                    onSelect={setNewTaskDueDate}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Input
                type="number"
                placeholder="Est. hours"
                value={newTaskEstimated}
                onChange={(e) => setNewTaskEstimated(e.target.value)}
                step="0.5"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateTask}>Create Task</Button>
              <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Task Cards */}
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No tasks found. Add a task to get started.
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.taskId}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors space-y-3"
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.status === 'Done'}
                    onCheckedChange={() => handleToggleTask(task)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <p className={cn(
                        "font-medium",
                        task.status === 'Done' && "line-through text-muted-foreground"
                      )}>
                        {task.taskName}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.taskId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                      
                      {task.dueDate && (
                        <span className={cn(
                          "flex items-center gap-1",
                          getDaysUntil(task.dueDate)?.includes('Overdue') && "text-destructive font-medium"
                        )}>
                          <Calendar className="h-3 w-3" />
                          {getDaysUntil(task.dueDate)}
                        </span>
                      )}

                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {task.hoursLogged.toFixed(1)}h / {task.estimatedHours.toFixed(1)}h
                      </span>

                      {task.hoursLogged !== task.estimatedHours && (
                        <Badge variant="outline" className={cn(
                          task.hoursLogged > task.estimatedHours ? "text-destructive" : "text-success"
                        )}>
                          {task.hoursLogged > task.estimatedHours ? '+' : ''}
                          {(task.hoursLogged - task.estimatedHours).toFixed(1)}h
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Section 3: Quick Log Hours */}
      {tasks.length > 0 && (
        <div className="p-4 border rounded-lg space-y-4 bg-card">
          <h3 className="text-lg font-semibold">Quick Log Hours</h3>
          <div className="flex gap-4">
            <Select value={selectedTaskForLog} onValueChange={setSelectedTaskForLog}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select task" />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((task) => (
                  <SelectItem key={task.taskId} value={task.taskId}>
                    {task.taskName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Hours"
              value={hoursToLog}
              onChange={(e) => setHoursToLog(e.target.value)}
              className="w-32"
              step="0.5"
            />
            <Button onClick={handleLogHours} disabled={!selectedTaskForLog || !hoursToLog}>
              Log Time
            </Button>
          </div>
        </div>
      )}

      {/* Section 4: Comments */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Comments & Notes</h3>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
              rows={3}
            />
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
              Add Comment
            </Button>
          </div>

          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No comments yet. Add the first one!
              </div>
            ) : (
              comments.map((comment, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{comment.author}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(comment.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{comment.commentText}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};