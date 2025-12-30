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
    const { projectContext } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the Workflow Builder agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('role', 'workflow_builder')
      .single();

    if (agentError || !agent) {
      console.error('Error fetching agent:', agentError);
      throw new Error('Workflow Builder agent not found');
    }

    // Build the user prompt with project context
    const userPrompt = `Create an n8n automation workflow for this client:

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

Generate a complete n8n workflow JSON that addresses these challenges and achieves the desired outcomes.`;

    console.log('Sending request to Lovable AI for Workflow Builder');
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
    const workflowJson = data.choices?.[0]?.message?.content;

    if (!workflowJson) {
      throw new Error('No workflow generated');
    }

    // Try to parse and validate the JSON
    let parsedWorkflow;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanJson = workflowJson.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.slice(7);
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.slice(3);
      }
      if (cleanJson.endsWith('```')) {
        cleanJson = cleanJson.slice(0, -3);
      }
      cleanJson = cleanJson.trim();
      
      parsedWorkflow = JSON.parse(cleanJson);
      
      // Validate basic structure
      if (!parsedWorkflow.nodes || !Array.isArray(parsedWorkflow.nodes)) {
        throw new Error('Invalid workflow: missing nodes array');
      }
      if (!parsedWorkflow.connections) {
        parsedWorkflow.connections = {};
      }
      
      console.log('Generated workflow with', parsedWorkflow.nodes.length, 'nodes');
    } catch (parseError) {
      console.error('Failed to parse workflow JSON:', parseError);
      console.error('Raw response:', workflowJson);
      throw new Error('Generated workflow is not valid JSON');
    }

    return new Response(JSON.stringify({ 
      workflow: parsedWorkflow,
      raw: JSON.stringify(parsedWorkflow, null, 2)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Workflow Builder error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
