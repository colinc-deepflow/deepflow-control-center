/**
 * API Service for DeepFlow Backend
 * Handles all communication with the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface BackendProject {
  id: string;
  client_name: string;
  client_email: string;
  contact_name?: string;
  phone_number?: string;
  industry?: string;
  team_size?: string;
  current_challenges?: string;
  current_process?: string;
  desired_outcomes?: string;
  status: string;
  lead_score?: number;
  estimated_revenue?: number;
  complexity_score?: number;
  created_at: string;
  updated_at: string;
  agent_status?: {
    overview?: 'pending' | 'processing' | 'completed' | 'failed';
    proposal?: 'pending' | 'processing' | 'completed' | 'failed';
    build_guide?: 'pending' | 'processing' | 'completed' | 'failed';
    workflow?: 'pending' | 'processing' | 'completed' | 'failed';
    dashboard?: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: 'pending' | 'processing' | 'completed' | 'failed';
  };
  agent_outputs?: {
    overview?: any;
    proposal?: string;
    build_guide?: string;
    workflow?: any;
    dashboard?: any;
    progress?: any;
  };
}

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

export interface IntakeFormData {
  client_name: string;
  client_email: string;
  contact_name?: string;
  phone_number?: string;
  industry?: string;
  team_size?: string;
  current_challenges?: string;
  current_process?: string;
  desired_outcomes?: string;
}

/**
 * Convert backend project format to frontend project format
 */
function convertBackendProject(backendProject: BackendProject): Project {
  // Map backend status to frontend status
  const statusMap: { [key: string]: Project['status'] } = {
    'new': 'New Lead',
    'contacted': 'Contacted',
    'building': 'Building',
    'deployed': 'Deployed',
    'live': 'Live'
  };

  return {
    id: backendProject.id,
    timestamp: backendProject.created_at,
    clientName: backendProject.client_name,
    clientEmail: backendProject.client_email,
    status: statusMap[backendProject.status.toLowerCase()] || 'New Lead',
    leadScore: backendProject.lead_score || 0,
    revenueValue: backendProject.estimated_revenue || 0,
    phase: backendProject.agent_status?.overview === 'completed' ? 'Analyzed' : 'Pending Analysis',
    contactName: backendProject.contact_name,
    phoneNumber: backendProject.phone_number,
    industry: backendProject.industry,
    teamSize: backendProject.team_size,
    currentChallenges: backendProject.current_challenges,
    currentProcess: backendProject.current_process,
    desiredOutcomes: backendProject.desired_outcomes,
    proposalHtml: backendProject.agent_outputs?.proposal,
    buildGuideMarkdown: backendProject.agent_outputs?.build_guide,
    workflowJson: backendProject.agent_outputs?.workflow ? JSON.stringify(backendProject.agent_outputs.workflow) : undefined,
  };
}

/**
 * Fetch all projects from the backend
 */
export async function fetchProjects(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<Project[]> {
  const searchParams = new URLSearchParams();

  if (params?.status) searchParams.append('status', params.status);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());

  const url = `${API_BASE_URL}/api/projects${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();

    // Convert backend projects to frontend format
    return data.projects.map(convertBackendProject);
  } catch (error) {
    console.error('Error fetching projects from backend:', error);
    throw error;
  }
}

/**
 * Fetch a single project by ID
 */
export async function fetchProject(id: string): Promise<Project> {
  const url = `${API_BASE_URL}/api/projects/${id}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch project: ${response.statusText}`);
    }

    const backendProject = await response.json();
    return convertBackendProject(backendProject);
  } catch (error) {
    console.error('Error fetching project from backend:', error);
    throw error;
  }
}

/**
 * Submit intake form
 */
export async function submitIntakeForm(formData: IntakeFormData): Promise<{ project_id: string; message: string }> {
  const url = `${API_BASE_URL}/api/intake`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to submit intake form: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting intake form:', error);
    throw error;
  }
}

/**
 * Approve an agent output
 */
export async function approveAgentOutput(projectId: string, agentType: string): Promise<void> {
  const url = `${API_BASE_URL}/api/projects/${projectId}/approve/${agentType}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to approve ${agentType}: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error approving ${agentType}:`, error);
    throw error;
  }
}

/**
 * Create WebSocket connection for real-time project updates
 */
export function connectProjectWebSocket(
  projectId: string,
  onMessage: (data: any) => void,
  onError?: (error: Event) => void,
  onClose?: (event: CloseEvent) => void
): WebSocket {
  const wsUrl = API_BASE_URL.replace('http', 'ws');
  const ws = new WebSocket(`${wsUrl}/ws/projects/${projectId}`);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onError) onError(error);
  };

  ws.onclose = (event) => {
    console.log('WebSocket closed:', event);
    if (onClose) onClose(event);
  };

  return ws;
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; app: string; version: string }> {
  const url = `${API_BASE_URL}/health`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
}
