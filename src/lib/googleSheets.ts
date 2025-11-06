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
