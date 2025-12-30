import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardContext {
  clientName: string;
  industry?: string;
  teamSize?: string;
  currentChallenges?: string;
  currentProcess?: string;
  desiredOutcomes?: string;
  notes?: string;
}

export interface DashboardComponent {
  type: string;
  title: string;
  dataSource?: string;
  icon?: string;
  chartType?: string;
  actions?: string[];
}

export interface DashboardPage {
  name: string;
  path: string;
  layout: string;
  components: DashboardComponent[];
}

export interface DashboardSpec {
  appName: string;
  description: string;
  theme: {
    primaryColor: string;
    style: string;
  };
  pages: DashboardPage[];
  dataConnections: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  features: string[];
}

export const useDashboardBuilder = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateDashboard = async (
    projectContext: DashboardContext,
    workflowJson?: string
  ): Promise<DashboardSpec | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('dashboard-builder', {
        body: { projectContext, workflowJson },
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.spec) {
        throw new Error('No dashboard specification generated');
      }

      return data.spec as DashboardSpec;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate dashboard';
      setError(errorMessage);
      console.error('Dashboard generation error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateDashboard,
    isGenerating,
    error,
  };
};
