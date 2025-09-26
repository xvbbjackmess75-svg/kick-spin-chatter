import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PROXYCHECK_API_KEY = '045154-369d77-9171q5-n89896';

interface ProxyCheckResponse {
  status: string;
  [key: string]: any;
}

async function checkProxyVPN(ipAddress: string) {
  try {
    const response = await fetch(`https://proxycheck.io/v2/${ipAddress}?key=${PROXYCHECK_API_KEY}&vpn=1&asn=1&provider=1&country=1&risk=1`);
    const data: ProxyCheckResponse = await response.json();
    
    console.log('ProxyCheck.io response:', JSON.stringify(data));
    
    if (data.status === 'ok' && data[ipAddress]) {
      const ipData = data[ipAddress];
      
      return {
        isVpn: ipData.proxy === 'yes' && ipData.type === 'VPN',
        isProxy: ipData.proxy === 'yes' && ipData.type !== 'VPN',
        isTor: ipData.proxy === 'yes' && ipData.type === 'TOR',
        proxyType: ipData.type || 'Unknown',
        riskScore: ipData.risk || 0,
        countryCode: ipData.isocode || null,
        countryName: ipData.country || null,
        provider: ipData.provider || null
      };
    }
    
    return {
      isVpn: false,
      isProxy: false,
      isTor: false,
      proxyType: null,
      riskScore: 0,
      countryCode: null,
      countryName: null,
      provider: null
    };
  } catch (error) {
    console.error('Error checking ProxyCheck.io:', error);
    return {
      isVpn: false,
      isProxy: false,
      isTor: false,
      proxyType: null,
      riskScore: 0,
      countryCode: null,
      countryName: null,
      provider: null
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user IP address from headers
    const clientIP = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    const userAgent = req.headers.get('user-agent') || null;

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Checking IP ${clientIP} for user ${user_id}`);

    // Check if IP is VPN/Proxy using ProxyCheck.io
    const proxyData = await checkProxyVPN(clientIP);

    // Call the enhanced track_user_ip function with VPN/Proxy data
    const { error } = await supabaseClient.rpc('track_user_ip', {
      p_user_id: user_id,
      p_ip_address: clientIP,
      p_user_agent: userAgent,
      p_is_vpn: proxyData.isVpn,
      p_is_proxy: proxyData.isProxy,
      p_is_tor: proxyData.isTor,
      p_proxy_type: proxyData.proxyType,
      p_risk_score: proxyData.riskScore,
      p_country_code: proxyData.countryCode,
      p_country_name: proxyData.countryName,
      p_provider: proxyData.provider
    });

    if (error) {
      console.error('Error tracking user IP:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to track IP address' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        ip: clientIP,
        vpnDetected: proxyData.isVpn || proxyData.isProxy || proxyData.isTor,
        proxyType: proxyData.proxyType,
        riskScore: proxyData.riskScore,
        message: 'IP address tracked and analyzed successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in track-user-ip function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})