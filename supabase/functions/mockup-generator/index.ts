import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectContext, stylePreference } = await req.json() as { 
      projectContext: ProjectContext;
      stylePreference?: string;
    };

    console.log('Generating mockup for:', projectContext.clientName);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a Mockup Generator Agent that creates detailed UI mockup specifications from project proposals.

Analyze the project context and generate a comprehensive mockup specification that includes:
1. Multiple page layouts with component definitions
2. 3 style variations (modern, bold, professional) with color schemes
3. Realistic placeholder content matching the business
4. Interactive element definitions

Output ONLY valid JSON in this exact structure:
{
  "projectName": "string",
  "description": "string",
  "styleVariations": [
    {
      "name": "modern" | "bold" | "professional",
      "primaryColor": "#hex",
      "secondaryColor": "#hex", 
      "accentColor": "#hex",
      "fontFamily": "string",
      "description": "string"
    }
  ],
  "pages": [
    {
      "name": "string",
      "path": "/string",
      "description": "string",
      "components": [
        {
          "type": "hero" | "features" | "pricing" | "testimonials" | "cta" | "contact" | "stats" | "gallery" | "faq" | "footer" | "navigation",
          "title": "string",
          "subtitle": "string",
          "content": {},
          "props": {}
        }
      ]
    }
  ],
  "globalComponents": [
    {
      "type": "navigation" | "footer",
      "props": {}
    }
  ],
  "suggestedImages": [
    {
      "location": "string",
      "description": "string",
      "style": "string"
    }
  ],
  "userFlows": [
    {
      "name": "string",
      "steps": ["string"]
    }
  ]
}`;

    const userPrompt = `Create a mockup specification for this project:

Client: ${projectContext.clientName}
Industry: ${projectContext.industry || 'Not specified'}
Team Size: ${projectContext.teamSize || 'Not specified'}

Current Challenges:
${projectContext.currentChallenges || 'Not specified'}

Current Process:
${projectContext.currentProcess || 'Not specified'}

Desired Outcomes:
${projectContext.desiredOutcomes || 'Not specified'}

Additional Notes:
${projectContext.notes || 'None'}

${projectContext.proposalHtml ? `Proposal Content:\n${projectContext.proposalHtml.substring(0, 2000)}` : ''}

${stylePreference ? `Preferred Style: ${stylePreference}` : 'Generate all 3 style variations.'}

Generate a comprehensive mockup specification with realistic content that matches this business. Include at least 3-4 pages and multiple component types.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Extract JSON from response
    let mockupSpec;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        mockupSpec = JSON.parse(jsonMatch[1]);
      } else {
        mockupSpec = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse mockup JSON:', parseError);
      console.log('Raw content:', content);
      throw new Error('Failed to parse mockup specification');
    }

    console.log('Mockup generated successfully for:', projectContext.clientName);

    return new Response(JSON.stringify({ 
      success: true,
      mockup: mockupSpec 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Mockup generation error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
