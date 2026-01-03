// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { message, profile, replyType } = await req.json();

    // 1. Prepare Context & Image
    const contextText = profile.context_description || "";
    // Extract URL if it exists
    const urlMatch = contextText.match(/\[SCREENSHOT_URL: (.*?)\]/);
    const imageUrl = urlMatch ? urlMatch[1] : null;
    const cleanContext = contextText.replace(/\[SCREENSHOT_URL:.*?\]/, '').trim();

    // 2. Select the Best Model
    // If we have an image, use the NEW Llama 4 Vision model
    // If text only, use the stable Llama 3.3 70B
    let selectedModel = 'llama-3.3-70b-versatile';
    if (imageUrl) {
      selectedModel = 'meta-llama/llama-4-scout-17b-16e-instruct';
    }

    console.log(`Using Model: ${selectedModel} (Image present: ${!!imageUrl})`);

    // 3. Build the Message
    const userContent: any[] = [
      { 
        type: "text", 
        text: `System: You are a witty digital wingman. 
        CONTEXT: Name: ${profile.name}, Relationship: ${profile.relationship}.
        DETAILS: ${cleanContext}.
        
        INCOMING MESSAGE: "${message}"
        
        TASK: Generate 3 distinct, human-sounding replies in a ${replyType} vibe.
        If an image is provided, analyze the chat screenshot for context.
        
        FORMAT: Return ONLY a raw JSON array of strings. 
        Example: ["Reply 1", "Reply 2", "Reply 3"]` 
      }
    ];

    if (imageUrl) {
      console.log("Attaching image:", imageUrl);
      userContent.push({
        type: "image_url",
        image_url: {
          url: imageUrl
        }
      });
    }

    // 4. Call Groq API
    const groqKey = Deno.env.get('GROQ_API_KEY');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'user',
            content: userContent
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        stream: false
      }),
    });

    const data = await response.json();
    
    // 5. Handle Errors
    if (data.error) {
      console.error("Groq Error:", data.error);
      throw new Error(data.error.message);
    }

    // 6. Parse Response
    let replyText = data.choices?.[0]?.message?.content || "[]";
    
    // Clean up code blocks
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
      console.error("JSON Parse Error", e);
      replies = [replyText]; 
    }

    return new Response(JSON.stringify({ replies }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});