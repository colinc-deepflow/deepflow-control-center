import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectContext, workflowJson } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the Dashboard Builder agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('role', 'dashboard_builder')
      .single();

    if (agentError || !agent) {
      console.error('Error fetching agent:', agentError);
      throw new Error('Dashboard Builder agent not found');
    }

    // Analyze workflow to understand what data points exist
    let workflowAnalysis = '';
    if (workflowJson) {
      try {
        const workflow = JSON.parse(workflowJson);
        const nodeTypes = workflow.nodes?.map((n: any) => n.type) || [];
        const nodeNames = workflow.nodes?.map((n: any) => n.name) || [];
        workflowAnalysis = `
## Existing Workflow Analysis
- **Workflow Name**: ${workflow.name || 'Unnamed'}
- **Node Count**: ${workflow.nodes?.length || 0}
- **Node Types**: ${[...new Set(nodeTypes)].join(', ')}
- **Node Names**: ${nodeNames.join(', ')}

Based on these nodes, design dashboard components that visualize the data flowing through this workflow.`;
      } catch {
        workflowAnalysis = '## No workflow available yet - design a general-purpose dashboard based on client needs.';
      }
    }

    // Build the user prompt with project context
    const userPrompt = `Design a client dashboard for this automation project:

## Client Information
- **Client Name**: ${projectContext.clientName}
- **Industry**: ${projectContext.industry || 'Not specified'}
- **Team Size**: ${projectContext.teamSize || 'Not specified'}

## Current Challenges
${projectContext.currentChallenges || 'No specific challenges mentioned'}

## Current Process
${projectContext.currentProcess || 'No current process described'}

## Desired Outcomes
${projectContext.desiredOutcomes || 'General automation and efficiency improvements'}

## Additional Context
${projectContext.notes || 'No additional notes'}

${workflowAnalysis}

Generate a complete dashboard specification JSON that addresses these needs and provides the client with visibility and control over their automated processes.`;

    console.log('Sending request to Lovable AI for Dashboard Builder');
    console.log('User prompt:', userPrompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: agent.model || 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: agent.system_prompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const dashboardSpec = data.choices?.[0]?.message?.content;

    if (!dashboardSpec) {
      throw new Error('No dashboard specification generated');
    }

    // Try to parse and validate the JSON
    let parsedSpec;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanJson = dashboardSpec.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.slice(7);
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.slice(3);
      }
      if (cleanJson.endsWith('```')) {
        cleanJson = cleanJson.slice(0, -3);
      }
      cleanJson = cleanJson.trim();
      
      parsedSpec = JSON.parse(cleanJson);
      
      // Validate basic structure
      if (!parsedSpec.appName) {
        parsedSpec.appName = `${projectContext.clientName} Dashboard`;
      }
      if (!parsedSpec.pages || !Array.isArray(parsedSpec.pages)) {
        throw new Error('Invalid spec: missing pages array');
      }
      
      console.log('Generated dashboard spec with', parsedSpec.pages.length, 'pages');
    } catch (parseError) {
      console.error('Failed to parse dashboard spec JSON:', parseError);
      console.error('Raw response:', dashboardSpec);
      throw new Error('Generated specification is not valid JSON');
    }

    return new Response(JSON.stringify({ 
      spec: parsedSpec,
      raw: JSON.stringify(parsedSpec, null, 2)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Dashboard Builder error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
