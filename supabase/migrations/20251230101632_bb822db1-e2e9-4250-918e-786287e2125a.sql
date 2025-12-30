-- Create ideas table for storing notes and ideas
CREATE TABLE public.ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'idea' CHECK (status IN ('idea', 'planning', 'in_progress', 'completed', 'archived')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

-- Public access policies (since no auth)
CREATE POLICY "Public read access for ideas" ON public.ideas FOR SELECT USING (true);
CREATE POLICY "Public insert access for ideas" ON public.ideas FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for ideas" ON public.ideas FOR UPDATE USING (true);
CREATE POLICY "Public delete access for ideas" ON public.ideas FOR DELETE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create advisor_conversations table for chat history
CREATE TABLE public.advisor_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advisor_conversations ENABLE ROW LEVEL SECURITY;

-- Public access policies
CREATE POLICY "Public read access for advisor_conversations" ON public.advisor_conversations FOR SELECT USING (true);
CREATE POLICY "Public insert access for advisor_conversations" ON public.advisor_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for advisor_conversations" ON public.advisor_conversations FOR UPDATE USING (true);
CREATE POLICY "Public delete access for advisor_conversations" ON public.advisor_conversations FOR DELETE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_advisor_conversations_updated_at
  BEFORE UPDATE ON public.advisor_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();