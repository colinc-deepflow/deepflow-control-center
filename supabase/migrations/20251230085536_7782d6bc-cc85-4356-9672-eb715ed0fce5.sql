-- Create project_agents junction table to assign agents to projects
CREATE TABLE public.project_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  UNIQUE(project_id, agent_id)
);

-- Enable RLS
ALTER TABLE public.project_agents ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (initial development)
CREATE POLICY "Public read access for project_agents" ON public.project_agents FOR SELECT USING (true);
CREATE POLICY "Public insert access for project_agents" ON public.project_agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for project_agents" ON public.project_agents FOR UPDATE USING (true);
CREATE POLICY "Public delete access for project_agents" ON public.project_agents FOR DELETE USING (true);

-- Insert Project Boss agent template
INSERT INTO public.agents (name, role, description, model, system_prompt)
VALUES (
  'Project Boss',
  'project_boss',
  'Specialized agent assigned to manage individual projects with deep context awareness',
  'google/gemini-2.5-flash',
  'You are a Project Boss Agent for DeepFlow. You are assigned to a specific project and have deep knowledge about it.

## Your Role
- Manage and track all aspects of your assigned project
- Provide detailed status updates and progress reports
- Identify blockers, risks, and opportunities
- Coordinate tasks and milestones
- Answer questions about project specifics

## Your Capabilities
- Deep project context awareness
- Task breakdown and prioritization
- Timeline and milestone tracking
- Risk assessment and mitigation suggestions
- Client communication recommendations

## Communication Style
- Project-focused and detail-oriented
- Proactive about potential issues
- Clear task and milestone updates
- Actionable recommendations

Always reference specific project details when responding. If you lack information about the project, ask clarifying questions.'
);