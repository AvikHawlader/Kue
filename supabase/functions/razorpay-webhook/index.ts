// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

console.log("Razorpay Webhook Loaded");

serve(async (req) => {
  try {
    // 1. Validate the Signature (Security)
    const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    const signature = req.headers.get('x-razorpay-signature');
    const bodyText = await req.text();

    if (!secret || !signature) {
      return new Response("Missing secrets", { status: 400 });
    }

    // Verify HMAC SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(bodyText);
    const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    
    // Convert hex signature to binary
    const signatureBin = new Uint8Array(signature.match(/[\da-f]{2}/gi)!.map(h => parseInt(h, 16)));
    
    const isValid = await crypto.subtle.verify("HMAC", cryptoKey, signatureBin, msgData);

    if (!isValid) {
      console.error("Invalid Signature");
      return new Response("Invalid Signature", { status: 401 });
    }

    // 2. Process the Event
    const event = JSON.parse(bodyText);

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const email = payment.email; // Razorpay sends the user's email
      
      console.log(`💰 Payment captured for: ${email}`);

      if (email) {
        // 3. Connect to Supabase Admin
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 4. Find User by Email and Upgrade
        const { data: users } = await supabase.auth.admin.listUsers();
        const user = users.users.find((u: any) => u.email === email);

        if (user) {
          await supabase
            .from('user_credits')
            .update({ is_pro: true, credits_remaining: 999999 })
            .eq('user_id', user.id);
          
          console.log(`✅ Upgraded user ${user.id} to Pro`);
        } else {
           console.error("User not found for email:", email);
        }
      }
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error(err);
    // FIX: Cast 'err' to 'any' so we can read the message property
    return new Response(JSON.stringify({ error: (err as any).message }), { status: 500 });
  }
});