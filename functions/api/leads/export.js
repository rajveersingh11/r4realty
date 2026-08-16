// Cloudflare Pages Function: /api/leads/export
// Handles CSV export (Admin protected)

function checkAdminAuth(request, env) {
  const adminPin = request.headers.get('x-admin-pin');
  const expectedPin = env.ADMIN_PIN;
  if (!expectedPin || !adminPin || adminPin !== expectedPin) {
    return false;
  }
  return true;
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!checkAdminAuth(request, env)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Invalid Admin PIN' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    let leads = [];
    if (env.DB) {
      const { results } = await env.DB.prepare(
        'SELECT * FROM leads ORDER BY timestamp DESC'
      ).all();
      leads = results || [];
    }

    const filename = `r4realty_leads_${new Date().toISOString().slice(0, 10)}.csv`;
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    let csvContent = 'Date & Time,Name,Phone,Email,Project,Message,Status\n';

    for (const lead of leads) {
      const row = [
        `"${(lead.timestamp || '').toString().replace(/"/g, '""')}"`,
        `"${(lead.name || '').toString().replace(/"/g, '""')}"`,
        `"${(lead.phone || '').toString().replace(/"/g, '""')}"`,
        `"${(lead.email || '').toString().replace(/"/g, '""')}"`,
        `"${(lead.project || '').toString().replace(/"/g, '""')}"`,
        `"${(lead.message || '').toString().replace(/"/g, '""')}"`,
        `"${(lead.status || 'New').toString().replace(/"/g, '""')}"`
      ];
      csvContent += row.join(',') + '\n';
    }

    return new Response(csvContent, {
      status: 200,
      headers
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to export CSV: ' + error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
