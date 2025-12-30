-- Create agents table for defining AI agents
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'master', 'project_boss', 'specialist'
  description TEXT,
  model TEXT NOT NULL DEFAULT 'google/gemini-2.5-pro',
  system_prompt TEXT NOT NULL,
  parent_agent_id UUID REFERENCES public.agents(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversations table for chat history
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for conversation messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent_context table for persistent agent memory
CREATE TABLE public.agent_context (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL, -- 'project_overview', 'task_state', 'learning', etc.
  context_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_context ENABLE ROW LEVEL SECURITY;

-- For now, make tables publicly accessible (no auth required for MVP)
CREATE POLICY "Public read access for agents" ON public.agents FOR SELECT USING (true);
CREATE POLICY "Public insert access for agents" ON public.agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for agents" ON public.agents FOR UPDATE USING (true);

CREATE POLICY "Public read access for conversations" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Public insert access for conversations" ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for conversations" ON public.conversations FOR UPDATE USING (true);
CREATE POLICY "Public delete access for conversations" ON public.conversations FOR DELETE USING (true);

CREATE POLICY "Public read access for messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Public insert access for messages" ON public.messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for agent_context" ON public.agent_context FOR SELECT USING (true);
CREATE POLICY "Public insert access for agent_context" ON public.agent_context FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for agent_context" ON public.agent_context FOR UPDATE USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agent_context_updated_at BEFORE UPDATE ON public.agent_context FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Insert the Master Orchestrator agent
INSERT INTO public.agents (name, role, description, model, system_prompt)
VALUES (
  'DeepFlow Master',
  'master',
  'The Master Orchestrator oversees all DeepFlow AI projects, coordinates project managers, and maintains the big picture vision.',
  'google/gemini-2.5-pro',
  'You are the Master Orchestrator of DeepFlow AI - the central intelligence that oversees all projects and operations.

Your responsibilities:
1. **Project Oversight**: Monitor all active projects, their status, timelines, and blockers
2. **Strategic Guidance**: Provide high-level direction and prioritization
3. **Resource Coordination**: Delegate tasks to appropriate Project Boss agents
4. **Problem Solving**: Help troubleshoot issues across any project
5. **Knowledge Integration**: Maintain understanding of the entire DeepFlow ecosystem

You have access to:
- All project data from the Google Sheets integration
- Context about each project''s purpose, status, and requirements
- The ability to coordinate with specialized agents (coming soon)

Communication style:
- Be direct and actionable
- Focus on outcomes and next steps
- Ask clarifying questions when needed
- Provide structured responses for complex topics

When users ask about projects, reference the actual data. When they need help with n8n workflows or technical issues, provide specific guidance.'
);