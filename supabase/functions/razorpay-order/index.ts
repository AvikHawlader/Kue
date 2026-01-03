// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Get the User from the Request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header passed');
    }
    
    // 2. Call Razorpay to Create Order
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    
    if (!keyId || !keySecret) {
      throw new Error('Razorpay keys not configured in Supabase Secrets');
    }

    const authString = btoa(`${keyId}:${keySecret}`)

    // Create an order for ₹199 (Amount is in Paise, so 19900 = ₹199)
    const orderBody = {
      amount: 19900, 
      currency: "INR",
      receipt: "receipt_" + Math.random().toString(36).substring(7),
      notes: {
        plan: "pro_monthly" 
      }
    }

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderBody)
    })

    const orderData = await response.json()

    if (orderData.error) {
       throw new Error(orderData.error.description);
    }

    return new Response(JSON.stringify(orderData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    // FIX: Cast 'error' to 'any' so we can read the message property
    return new Response(JSON.stringify({ error: (error as any).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})