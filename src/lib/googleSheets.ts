export interface Project {
  id: string;
  timestamp: string;
  clientName: string;
  clientEmail: string;
  status: 'New Lead' | 'Contacted' | 'Building' | 'Deployed' | 'Live';
  leadScore: number;
  revenueValue: number;
  phase: string;
  notes?: string;
  driveFolderLink?: string;
  proposalHtml?: string;
  workflowJson?: string;
  buildGuideMarkdown?: string;
  contactName?: string;
  phoneNumber?: string;
  industry?: string;
  teamSize?: string;
  currentChallenges?: string;
  currentProcess?: string;
  desiredOutcomes?: string;
  buildProgress?: {
    timeline?: string[];
    tasks?: { title: string; status: 'todo' | 'in-progress' | 'done' }[];
    hoursLogged?: number;
    files?: string[];
    comments?: string[];
  };
}

export interface Task {
  taskId: string;
  projectId: string;
  taskName: string;
  status: 'To Do' | 'In Progress' | 'Done' | 'Blocked';
  dueDate: string;
  hoursLogged: number;
  estimatedHours: number;
}

export interface Comment {
  projectId: string;
  timestamp: string;
  author: string;
  commentText: string;
}

export interface GoogleSheetsConfig {
  apiKey: string;
  spreadsheetId: string;
  sheetName: string;
}

const STORAGE_KEY = 'deepflow_sheets_config';

export const saveConfig = (config: GoogleSheetsConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const loadConfig = (): GoogleSheetsConfig | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const clearConfig = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const fetchProjects = async (config: GoogleSheetsConfig): Promise<Project[]> => {
  const { apiKey, spreadsheetId, sheetName } = config;
  const range = `${sheetName}!A:Z`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch data from Google Sheets');
    }

    const data = await response.json();
    const rows = data.values || [];

    // Skip header row
    return rows.slice(1).map((row: string[], index: number) => ({
      id: row[0] || `project-${index}`,
      timestamp: row[1] || new Date().toISOString(),
      clientName: row[2] || 'Unknown Client',
      clientEmail: row[3] || '',
      status: (row[4] || 'New Lead') as Project['status'],
      leadScore: parseInt(row[5]) || 0,
      revenueValue: parseFloat(row[6]) || 0,
      phase: row[7] || '',
      notes: row[8] || '',
      driveFolderLink: row[9] || '',
      proposalHtml: row[10] || '',
      workflowJson: row[11] || '',
      buildGuideMarkdown: row[12] || '',
      contactName: row[13] || '',
      phoneNumber: row[14] || '',
      industry: row[15] || '',
      teamSize: row[16] || '',
      currentChallenges: row[17] || '',
      currentProcess: row[18] || '',
      desiredOutcomes: row[19] || '',
    }));
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

export const updateProjectStatus = async (
  config: GoogleSheetsConfig,
  projectId: string,
  newStatus: Project['status']
): Promise<void> => {
  // For now, we'll just simulate the update
  // In a real implementation, you'd use the Google Sheets API to update the cell
  console.log(`Updating project ${projectId} to status ${newStatus}`);
};

// Task Management Functions (Using Local Storage)
const TASKS_STORAGE_KEY = 'deepflow_tasks';
const COMMENTS_STORAGE_KEY = 'deepflow_comments';

const loadTasksFromStorage = (): Task[] => {
  const stored = localStorage.getItem(TASKS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveTasksToStorage = (tasks: Task[]) => {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
};

export const fetchTasks = async (config: GoogleSheetsConfig, projectId: string): Promise<Task[]> => {
  // Fetch from local storage instead of Google Sheets
  const allTasks = loadTasksFromStorage();
  return allTasks.filter(task => task.projectId === projectId);
};

export const createTask = async (config: GoogleSheetsConfig, task: Task): Promise<void> => {
  // Store task in local storage
  const allTasks = loadTasksFromStorage();
  allTasks.push(task);
  saveTasksToStorage(allTasks);
  console.log('Task created successfully:', task.taskName);
};

export const updateTask = async (config: GoogleSheetsConfig, task: Task): Promise<void> => {
  // Update task in local storage
  const allTasks = loadTasksFromStorage();
  const taskIndex = allTasks.findIndex(t => t.taskId === task.taskId);
  
  if (taskIndex === -1) {
    throw new Error('Task not found');
  }
  
  allTasks[taskIndex] = task;
  saveTasksToStorage(allTasks);
  console.log('Task updated successfully:', task.taskName);
};

export const deleteTask = async (config: GoogleSheetsConfig, taskId: string): Promise<void> => {
  // Delete task from local storage
  const allTasks = loadTasksFromStorage();
  const filteredTasks = allTasks.filter(t => t.taskId !== taskId);
  
  if (allTasks.length === filteredTasks.length) {
    throw new Error('Task not found');
  }
  
  saveTasksToStorage(filteredTasks);
  console.log('Task deleted successfully');
};

// Comment Management Functions (Using Local Storage)
const loadCommentsFromStorage = (): Comment[] => {
  const stored = localStorage.getItem(COMMENTS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveCommentsToStorage = (comments: Comment[]) => {
  localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments));
};

export const fetchComments = async (config: GoogleSheetsConfig, projectId: string): Promise<Comment[]> => {
  // Fetch from local storage instead of Google Sheets
  const allComments = loadCommentsFromStorage();
  return allComments.filter(comment => comment.projectId === projectId);
};

export const createComment = async (config: GoogleSheetsConfig, comment: Comment): Promise<void> => {
  // Store comment in local storage
  const allComments = loadCommentsFromStorage();
  allComments.push(comment);
  saveCommentsToStorage(allComments);
  console.log('Comment created successfully');
};

export const DEFAULT_TASKS: Omit<Task, 'taskId' | 'projectId'>[] = [
  { taskName: 'Schedule kickoff call with client', status: 'To Do', dueDate: '', hoursLogged: 0, estimatedHours: 0.5 },
  { taskName: 'Gather API credentials and system access', status: 'To Do', dueDate: '', hoursLogged: 0, estimatedHours: 1 },
  { taskName: 'Import workflow to n8n', status: 'To Do', dueDate: '', hoursLogged: 0, estimatedHours: 2 },
  { taskName: 'Configure all nodes with client data', status: 'To Do', dueDate: '', hoursLogged: 0, estimatedHours: 8 },
  { taskName: 'Test workflow end-to-end', status: 'To Do', dueDate: '', hoursLogged: 0, estimatedHours: 3 },
  { taskName: 'Build client dashboard with Lovable AI', status: 'To Do', dueDate: '', hoursLogged: 0, estimatedHours: 6 },
  { taskName: 'Client UAT session', status: 'To Do', dueDate: '', hoursLogged: 0, estimatedHours: 2 },
  { taskName: 'Fix bugs and refinements', status: 'To Do', dueDate: '', hoursLogged: 0, estimatedHours: 4 },
  { taskName: 'Convert n8n to Python', status: 'To Do', dueDate: '', hoursLogged: 0, estimatedHours: 10 },
  { taskName: 'Deploy to production server', status: 'To Do', dueDate: '', hoursLogged: 0, estimatedHours: 3 },
  { taskName: 'Client training session', status: 'To Do', dueDate: '', hoursLogged: 0, estimatedHours: 2 },
  { taskName: 'Documentation and handoff', status: 'To Do', dueDate: '', hoursLogged: 0, estimatedHours: 2 },
];

export const createDefaultTasks = async (config: GoogleSheetsConfig, projectId: string): Promise<void> => {
  console.log('Creating default tasks for project:', projectId);
  // In production, this would batch append all default tasks
  for (const taskTemplate of DEFAULT_TASKS) {
    const task: Task = {
      taskId: `${Date.now()}-${Math.random()}`,
      projectId,
      ...taskTemplate,
    };
    await createTask(config, task);
  }
};
