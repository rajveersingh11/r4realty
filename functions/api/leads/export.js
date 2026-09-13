// Cloudflare Pages Function: /api/leads/export
// Handles CSV export (Admin protected)

function checkAdminAuth(request, env) {
  const adminPin = request.headers.get('x-admin-pin');
  const expectedPin = env.ADMIN_PIN;
  if (!expectedPin || !adminPin || typeof adminPin !== 'string') {
    return false;
  }
  if (adminPin.length !== expectedPin.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < adminPin.length; i++) {
    result |= adminPin.charCodeAt(i) ^ expectedPin.charCodeAt(i);
  }
  return result === 0;
}

function csvSafeCell(val) {
  if (val == null || val === undefined) return '""';
  let s = val.toString();
  if (/^[=+\-@\t\r]/.test(s)) {
    s = "'" + s;
  }
  return `"${s.replace(/"/g, '""')}"`;
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
        csvSafeCell(lead.timestamp),
        csvSafeCell(lead.name),
        csvSafeCell(lead.phone),
        csvSafeCell(lead.email),
        csvSafeCell(lead.project),
        csvSafeCell(lead.message),
        csvSafeCell(lead.status || 'New')
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
