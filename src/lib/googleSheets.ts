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
  clientPhone?: string;
  industry?: string;
  teamSize?: string;
  challenges?: string;
  proposalHtml?: string;
  buildGuideMarkdown?: string;
  workflowJson?: string;
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
      clientPhone: row[9] || '',
      industry: row[10] || '',
      teamSize: row[11] || '',
      challenges: row[12] || '',
      proposalHtml: row[13] || '',
      buildGuideMarkdown: row[14] || '',
      workflowJson: row[15] || '',
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

// Task Management Functions
export const fetchTasks = async (config: GoogleSheetsConfig, projectId: string): Promise<Task[]> => {
  const { apiKey, spreadsheetId } = config;
  const range = 'Tasks!A:G';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch tasks from Google Sheets');
    }

    const data = await response.json();
    const rows = data.values || [];

    // Skip header row and filter by project ID
    return rows.slice(1)
      .filter((row: string[]) => row[1] === projectId)
      .map((row: string[]) => ({
        taskId: row[0] || '',
        projectId: row[1] || '',
        taskName: row[2] || '',
        status: (row[3] || 'To Do') as Task['status'],
        dueDate: row[4] || '',
        hoursLogged: parseFloat(row[5]) || 0,
        estimatedHours: parseFloat(row[6]) || 0,
      }));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const createTask = async (config: GoogleSheetsConfig, task: Task): Promise<void> => {
  console.log('Creating task:', task);
  // In production, this would append to the Tasks sheet
  // Using Google Sheets API append method
};

export const updateTask = async (config: GoogleSheetsConfig, task: Task): Promise<void> => {
  console.log('Updating task:', task);
  // In production, this would update the specific row
  // Using Google Sheets API update method
};

export const deleteTask = async (config: GoogleSheetsConfig, taskId: string): Promise<void> => {
  console.log('Deleting task:', taskId);
  // In production, this would delete the specific row
  // Using Google Sheets API batchUpdate method
};

// Comment Management Functions
export const fetchComments = async (config: GoogleSheetsConfig, projectId: string): Promise<Comment[]> => {
  const { apiKey, spreadsheetId } = config;
  const range = 'Comments!A:D';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch comments from Google Sheets');
    }

    const data = await response.json();
    const rows = data.values || [];

    // Skip header row and filter by project ID
    return rows.slice(1)
      .filter((row: string[]) => row[0] === projectId)
      .map((row: string[]) => ({
        projectId: row[0] || '',
        timestamp: row[1] || '',
        author: row[2] || 'You',
        commentText: row[3] || '',
      }));
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

export const createComment = async (config: GoogleSheetsConfig, comment: Comment): Promise<void> => {
  console.log('Creating comment:', comment);
  // In production, this would append to the Comments sheet
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
