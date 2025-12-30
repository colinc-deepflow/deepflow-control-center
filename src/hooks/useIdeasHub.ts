import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Idea {
  id: string;
  title: string;
  content: string | null;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'idea' | 'planning' | 'in_progress' | 'completed' | 'archived';
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const useIdeasHub = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setIdeas((data || []) as Idea[]);
    } catch (err) {
      console.error('Error fetching ideas:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch ideas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const createIdea = async (idea: Partial<Idea>): Promise<Idea | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('ideas')
        .insert({
          title: idea.title || 'Untitled Idea',
          content: idea.content || null,
          category: idea.category || 'general',
          priority: idea.priority || 'medium',
          status: idea.status || 'idea',
          tags: idea.tags || [],
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      const newIdea = data as Idea;
      setIdeas(prev => [newIdea, ...prev]);
      return newIdea;
    } catch (err) {
      console.error('Error creating idea:', err);
      setError(err instanceof Error ? err.message : 'Failed to create idea');
      return null;
    }
  };

  const updateIdea = async (id: string, updates: Partial<Idea>): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('ideas')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
      
      setIdeas(prev => prev.map(idea => 
        idea.id === id ? { ...idea, ...updates } : idea
      ));
      return true;
    } catch (err) {
      console.error('Error updating idea:', err);
      setError(err instanceof Error ? err.message : 'Failed to update idea');
      return false;
    }
  };

  const deleteIdea = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('ideas')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      setIdeas(prev => prev.filter(idea => idea.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting idea:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete idea');
      return false;
    }
  };

  return {
    ideas,
    isLoading,
    error,
    createIdea,
    updateIdea,
    deleteIdea,
    refreshIdeas: fetchIdeas,
  };
};

export const useAdvisorChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (
    content: string, 
    currentIdea?: Idea
  ): Promise<void> => {
    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/business-advisor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            currentIdea: currentIdea ? {
              title: currentIdea.title,
              content: currentIdea.content,
              category: currentIdea.category,
              status: currentIdea.status,
            } : undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantContent = '';

      // Add empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                  return updated;
                });
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      console.error('Advisor chat error:', err);
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => setMessages([]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
};
