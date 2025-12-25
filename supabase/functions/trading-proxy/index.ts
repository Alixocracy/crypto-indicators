import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-agnic-token',
};

const AGNIC_ENDPOINT = 'https://api.agnicpay.xyz/api/x402/fetch?url=https://api.agnichub.xyz/v1/custom/trading-indicators/candles&method=POST';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const agnicToken = req.headers.get('x-agnic-token');
    
    if (!agnicToken) {
      throw new Error('Missing X-Agnic-Token header');
    }

    const payload = await req.json();
    
    console.log('Proxying request to Agnic:', JSON.stringify(payload));

    const response = await fetch(AGNIC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agnic-Token': agnicToken,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Agnic API error (${response.status}):`, errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Response received:', JSON.stringify(data).slice(0, 500));

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in trading-proxy function:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
