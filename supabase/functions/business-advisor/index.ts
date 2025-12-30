import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: Message[];
  currentIdea?: {
    title: string;
    content: string;
    category: string;
    status: string;
  };
  dashboardContext?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, currentIdea, dashboardContext } = await req.json() as RequestBody;

    console.log('Business Advisor chat request:', { 
      messageCount: messages.length,
      hasIdea: !!currentIdea 
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a Business Advisor AI assistant for DeepFlow, an automation agency dashboard. You act as a personal assistant and business advisor, helping the user brainstorm, plan, and refine ideas.

Your role is to:
1. Help brainstorm and expand on business ideas
2. Provide strategic advice on feature development
3. Suggest implementation approaches
4. Help prioritize and plan work
5. Offer insights on automation workflows and client management
6. Act as a sounding board for new concepts

Context about the DeepFlow dashboard:
- It's a CRM/project management tool for an automation agency
- It integrates with Google Sheets for client data
- It has AI agents for workflow building, dashboard generation, and mockup previews
- Clients are primarily joinery/construction businesses needing automation
- The system generates n8n workflows and Lovable dashboard specs

${dashboardContext ? `Additional context:\n${dashboardContext}` : ''}

${currentIdea ? `
Currently discussing idea:
- Title: ${currentIdea.title}
- Content: ${currentIdea.content}
- Category: ${currentIdea.category}
- Status: ${currentIdea.status}
` : ''}

Be conversational, helpful, and proactive. Suggest follow-up questions and action items. If discussing features, consider technical feasibility and user value.`;

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
          ...messages
        ],
        stream: true,
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

    // Stream the response
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Business advisor error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
