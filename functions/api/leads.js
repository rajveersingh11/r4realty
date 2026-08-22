// Cloudflare Pages Function: /api/leads
// Handles:
// - POST: Public lead capture
// - GET: Admin-protected fetch all leads
// - DELETE: Admin-protected clear leads

function checkAdminAuth(request, env) {
  const adminPin = request.headers.get('x-admin-pin');
  const expectedPin = env.ADMIN_PIN;
  if (!expectedPin || !adminPin || adminPin !== expectedPin) {
    return false;
  }
  return true;
}

// 1. Submit lead (POST /api/leads)
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { id, name, phone, email, project, message, timestamp, status } = body;

    if (!name || !phone) {
      return new Response(
        JSON.stringify({ error: 'Name and Phone number are required fields.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const leadId = id || `lead_${Date.now()}`;
    const leadName = name;
    const leadPhone = phone;
    const leadEmail = email || 'N/A';
    const leadProject = project || 'General Inquiry';
    const leadMessage = message || 'Interested in this property.';
    const leadTimestamp = timestamp || new Date().toLocaleString();
    const leadStatus = status || 'New';

    // If Cloudflare D1 Database binding exists
    if (env.DB) {
      await env.DB.prepare(
        `INSERT INTO leads (id, name, phone, email, project, message, timestamp, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          leadId,
          leadName,
          leadPhone,
          leadEmail,
          leadProject,
          leadMessage,
          leadTimestamp,
          leadStatus
        )
        .run();

      return new Response(
        JSON.stringify({ success: true, message: 'Lead stored in Cloudflare D1 database.' }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fallback if DB binding is not yet attached
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Lead received (D1 database binding not configured yet).'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to process lead: ' + error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// 2. Fetch all leads (GET /api/leads - Admin Only)
export async function onRequestGet(context) {
  const { request, env } = context;

  if (!checkAdminAuth(request, env)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Invalid Admin PIN' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    if (env.DB) {
      const { results } = await env.DB.prepare(
        'SELECT * FROM leads ORDER BY timestamp DESC'
      ).all();

      return new Response(JSON.stringify(results || []), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch database records: ' + error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// 3. Update lead status/notes (PATCH /api/leads - Admin Only)
export async function onRequestPatch(context) {
  const { request, env } = context;

  if (!checkAdminAuth(request, env)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Invalid Admin PIN' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { id, status, message } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Lead ID is required for status updates.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (env.DB) {
      if (status && message) {
        await env.DB.prepare(
          'UPDATE leads SET status = ?, message = ? WHERE id = ?'
        ).bind(status, message, id).run();
      } else if (status) {
        await env.DB.prepare(
          'UPDATE leads SET status = ? WHERE id = ?'
        ).bind(status, id).run();
      } else if (message) {
        await env.DB.prepare(
          'UPDATE leads SET message = ? WHERE id = ?'
        ).bind(message, id).run();
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Lead updated successfully.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Updated locally (D1 binding not configured).' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to update lead: ' + error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// 4. Delete lead(s) (DELETE /api/leads or DELETE /api/leads?id=xyz - Admin Only)
export async function onRequestDelete(context) {
  const { request, env } = context;

  if (!checkAdminAuth(request, env)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Invalid Admin PIN' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = new URL(request.url);
    const leadId = url.searchParams.get('id');

    if (env.DB) {
      if (leadId) {
        await env.DB.prepare('DELETE FROM leads WHERE id = ?').bind(leadId).run();
        return new Response(
          JSON.stringify({ success: true, message: `Lead ${leadId} deleted.` }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } else {
        await env.DB.prepare('DELETE FROM leads').run();
        return new Response(
          JSON.stringify({ success: true, message: 'Database records cleared successfully.' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Action processed (D1 binding not configured).' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Database delete operation failed: ' + error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

