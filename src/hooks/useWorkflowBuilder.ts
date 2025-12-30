import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WorkflowContext {
  clientName: string;
  industry?: string;
  teamSize?: string;
  currentChallenges?: string;
  currentProcess?: string;
  desiredOutcomes?: string;
  notes?: string;
}

export const useWorkflowBuilder = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateWorkflow = async (projectContext: WorkflowContext): Promise<string | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('workflow-builder', {
        body: { projectContext },
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.raw) {
        throw new Error('No workflow generated');
      }

      return data.raw;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate workflow';
      setError(errorMessage);
      console.error('Workflow generation error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateWorkflow,
    isGenerating,
    error,
  };
};
