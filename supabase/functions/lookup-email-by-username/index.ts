import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : '';

    if (!username || !/^[a-z0-9_]{3,30}$/.test(username)) {
      return new Response(JSON.stringify({ error: 'Username inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Find profile by username
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('user_id')
      .ilike('username', username)
      .maybeSingle();

    if (profileErr) throw profileErr;
    if (!profile) {
      // Generic error message to avoid username enumeration
      return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Look up the email from auth.users via admin API
    const { data: userData, error: userErr } = await admin.auth.admin.getUserById(profile.user_id);
    if (userErr || !userData?.user?.email) {
      return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ email: userData.user.email }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('lookup-email-by-username error', err);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
