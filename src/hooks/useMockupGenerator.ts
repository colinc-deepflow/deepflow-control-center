import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProjectContext {
  clientName: string;
  industry?: string;
  teamSize?: string;
  currentChallenges?: string;
  currentProcess?: string;
  desiredOutcomes?: string;
  notes?: string;
  proposalHtml?: string;
}

export interface StyleVariation {
  name: 'modern' | 'bold' | 'professional';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  description: string;
}

export interface MockupComponent {
  type: 'hero' | 'features' | 'pricing' | 'testimonials' | 'cta' | 'contact' | 'stats' | 'gallery' | 'faq' | 'footer' | 'navigation';
  title: string;
  subtitle?: string;
  content?: Record<string, unknown>;
  props?: Record<string, unknown>;
}

export interface MockupPage {
  name: string;
  path: string;
  description: string;
  components: MockupComponent[];
}

export interface SuggestedImage {
  location: string;
  description: string;
  style: string;
}

export interface UserFlow {
  name: string;
  steps: string[];
}

export interface MockupSpec {
  projectName: string;
  description: string;
  styleVariations: StyleVariation[];
  pages: MockupPage[];
  globalComponents: MockupComponent[];
  suggestedImages: SuggestedImage[];
  userFlows: UserFlow[];
}

export interface MockupRevision {
  id: string;
  timestamp: Date;
  mockup: MockupSpec;
  feedback?: string;
  selectedStyle?: string;
}

export const useMockupGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<MockupRevision[]>([]);

  const generateMockup = async (
    projectContext: ProjectContext,
    stylePreference?: string
  ): Promise<MockupSpec | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('mockup-generator', {
        body: { projectContext, stylePreference },
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.mockup) {
        throw new Error('No mockup specification generated');
      }

      const mockup = data.mockup as MockupSpec;
      
      // Add to revision history
      const newRevision: MockupRevision = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        mockup,
        selectedStyle: stylePreference,
      };
      setRevisions(prev => [...prev, newRevision]);

      return mockup;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate mockup';
      setError(errorMessage);
      console.error('Mockup generation error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const addFeedback = (revisionId: string, feedback: string) => {
    setRevisions(prev => 
      prev.map(rev => 
        rev.id === revisionId 
          ? { ...rev, feedback } 
          : rev
      )
    );
  };

  const clearRevisions = () => {
    setRevisions([]);
  };

  return {
    generateMockup,
    isGenerating,
    error,
    revisions,
    addFeedback,
    clearRevisions,
  };
};
