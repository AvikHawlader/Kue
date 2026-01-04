// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // 1. Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Identify the User
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (!user || userError) {
      throw new Error("Unauthorized user");
    }

    // 3. PARSE INPUT EARLY
    // We need to know if this is a regeneration BEFORE checking credits
    const { message, profile, replyType, isRegeneration } = await req.json();

    // 4. CHECK CREDITS
    const { data: creditData, error: creditError } = await supabase
      .from('user_credits')
      .select('credits_remaining, is_pro')
      .eq('user_id', user.id)
      .single();

    if (creditError || !creditData) {
      throw new Error("Could not find user credits");
    }

    // --- LOGIC UPDATE START ---
    
    // Only block if:
    // 1. User is NOT Pro
    // 2. User has 0 or less credits
    // 3. AND this is NOT a regeneration (Regenerations are allowed even at 0 credits if paid previously)
    if (!creditData.is_pro && creditData.credits_remaining <= 0 && !isRegeneration) {
      throw new Error("OUT_OF_CREDITS"); 
    }

    // 5. DEDUCT CREDIT 
    // Only deduct if:
    // 1. User is NOT Pro
    // 2. AND this is NOT a regeneration
    if (!creditData.is_pro && !isRegeneration) {
      await supabase
        .from('user_credits')
        .update({ credits_remaining: creditData.credits_remaining - 1 })
        .eq('user_id', user.id);
    }
    
    // --- LOGIC UPDATE END ---

    // 6. PREPARE AI CONTEXT
    const contextText = profile.context_description || "";
    const urlMatch = contextText.match(/\[SCREENSHOT_URL: (.*?)\]/);
    const imageUrl = urlMatch ? urlMatch[1] : null;
    const cleanContext = contextText.replace(/\[SCREENSHOT_URL:.*?\]/, '').trim();

    // Select Model
    let selectedModel = 'llama-3.3-70b-versatile';
    if (imageUrl) {
      selectedModel = 'meta-llama/llama-3.2-11b-vision-preview'; // Updated vision model suggestion
    }

    // Build Message
    const userContent: any[] = [
      { 
        type: "text", 
        text: `System: You are a witty digital wingman. 
        CONTEXT: Name: ${profile.name}, Relationship: ${profile.relationship}.
        DETAILS: ${cleanContext}.
        INCOMING MESSAGE: "${message}"
        TASK: Generate 3 distinct, human-sounding replies in a ${replyType} vibe.
        FORMAT: Return ONLY a raw JSON array of strings.` 
      }
    ];

    if (imageUrl) {
      userContent.push({
        type: "image_url",
        image_url: { url: imageUrl }
      });
    }

    // 7. CALL GROQ API
    const groqKey = Deno.env.get('GROQ_API_KEY');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'user', content: userContent }],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    // 8. PARSE OUTPUT
    let replyText = data.choices?.[0]?.message?.content || "[]";
    replyText = replyText.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBracket = replyText.indexOf('[');
    const lastBracket = replyText.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
      replyText = replyText.substring(firstBracket, lastBracket + 1);
    }

    let replies = [];
    try {
      replies = JSON.parse(replyText);
    } catch (e) {
      replies = [replyText]; 
    }

    return new Response(JSON.stringify({ replies }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    // Return specific error code for frontend handling
    if (error.message === "OUT_OF_CREDITS") {
      return new Response(JSON.stringify({ error: "OUT_OF_CREDITS" }), {
        status: 402, // Payment Required
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});