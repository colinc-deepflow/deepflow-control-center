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
  const { apiKey, spreadsheetId } = config;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tasks!A:G:append?valueInputOption=USER_ENTERED&key=${apiKey}`;
  
  const row = [
    task.taskId,
    task.projectId,
    task.taskName,
    task.status,
    task.dueDate,
    task.hoursLogged,
    task.estimatedHours,
  ];

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create task in Google Sheets');
    }
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTask = async (config: GoogleSheetsConfig, task: Task): Promise<void> => {
  const { apiKey, spreadsheetId } = config;
  
  // First, find the row number for this task
  const rangeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tasks!A:G?key=${apiKey}`;
  
  try {
    const rangeResponse = await fetch(rangeUrl);
    if (!rangeResponse.ok) {
      throw new Error('Failed to fetch tasks for update');
    }
    
    const rangeData = await rangeResponse.json();
    const rows = rangeData.values || [];
    
    // Find the row index (skip header row)
    const rowIndex = rows.findIndex((row: string[], index: number) => 
      index > 0 && row[0] === task.taskId
    );
    
    if (rowIndex === -1) {
      throw new Error('Task not found');
    }
    
    // Update the row (rowIndex + 1 because sheets are 1-indexed)
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tasks!A${rowIndex + 1}:G${rowIndex + 1}?valueInputOption=USER_ENTERED&key=${apiKey}`;
    
    const row = [
      task.taskId,
      task.projectId,
      task.taskName,
      task.status,
      task.dueDate,
      task.hoursLogged,
      task.estimatedHours,
    ];
    
    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    });
    
    if (!updateResponse.ok) {
      throw new Error('Failed to update task in Google Sheets');
    }
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (config: GoogleSheetsConfig, taskId: string): Promise<void> => {
  const { apiKey, spreadsheetId } = config;
  
  // First, find the row number for this task
  const rangeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tasks!A:G?key=${apiKey}`;
  
  try {
    const rangeResponse = await fetch(rangeUrl);
    if (!rangeResponse.ok) {
      throw new Error('Failed to fetch tasks for deletion');
    }
    
    const rangeData = await rangeResponse.json();
    const rows = rangeData.values || [];
    
    // Find the row index (skip header row)
    const rowIndex = rows.findIndex((row: string[], index: number) => 
      index > 0 && row[0] === taskId
    );
    
    if (rowIndex === -1) {
      throw new Error('Task not found');
    }
    
    // Delete the row using batchUpdate
    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate?key=${apiKey}`;
    
    const deleteResponse = await fetch(batchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0, // Assumes Tasks sheet is the first sheet. May need to adjust.
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        }],
      }),
    });
    
    if (!deleteResponse.ok) {
      throw new Error('Failed to delete task from Google Sheets');
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
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
  const { apiKey, spreadsheetId } = config;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Comments!A:D:append?valueInputOption=USER_ENTERED&key=${apiKey}`;
  
  const row = [
    comment.projectId,
    comment.timestamp,
    comment.author,
    comment.commentText,
  ];

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create comment in Google Sheets');
    }
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
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
