const url = 'https://wlmnddsoyilgweegvswo.supabase.co';
const key = 'sb_publishable_URc7zIwnD7x1DQsaxq2_Xw_BcPuhpU2';

async function test() {
  const res = await fetch(url + '/rest/v1/broadcast_requests?select=*&order=created_at.desc', {
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key
    }
  });
  const data = await res.json();
  
  const actualRequests = data.filter(dbR => {
    if (!dbR || !dbR.id) return false;
    if (dbR.status === 'PORTFOLIO_WORK' || String(dbR.id).startsWith('WORK-')) return false;
    if (dbR.status === 'CERTIFIED_REVIEW' || String(dbR.id).startsWith('REV-') || String(dbR.title || '').startsWith('CREATOR_REVIEW:')) return false;
    if (dbR.id.startsWith('USER-PROFILE-') || dbR.status === 'SYSTEM_USER_PROFILE') return false;
    if (["RFP-4120", "RFP-1044", "RFP-3891", "RFP-6482", "RFP-9821", "TEST-PING-1"].includes(dbR.id)) return false;
    if (dbR.status === 'CANCELLATA_DEFINITIVAMENTE' || dbR.status === 'DELETED') return false;
    return true;
  });

  console.log('actualRequests loaded from Supabase:', actualRequests.map(r => ({ id: r.id, status: r.status, email: r.client_email })));

  const testUsers = [
    { label: 'Not logged in (null)', user: null },
    { label: 'Anonymous Creator (anon@test.com)', user: { name: 'Anon Creator', email: 'anon@test.com', role: 'creator', id: 'maker_123' } },
    { label: 'Guest Creator default', user: { name: '', email: '', role: 'creator', id: '' } },
    { label: 'Maggimatteo22 Creator', user: { name: 'Maggimatteo22', email: 'maggimatteo22@gmail.com', role: 'creator', id: 'usr_maggimatteo22' } }
  ];

  testUsers.forEach(tu => {
    const AppState_user = tu.user;
    const myMakerName = ((AppState_user && AppState_user.name) || '').toLowerCase().trim();
    const myMakerEmail = ((AppState_user && AppState_user.email) || '').toLowerCase().trim();
    const myMakerUid = ((AppState_user && (AppState_user.userId || AppState_user.id)) || '').toLowerCase().trim();

    const visible = actualRequests.filter(r => {
      if (!r || !r.id) return false;
      if (["RFP-4120", "RFP-1044", "RFP-3891", "RFP-6482", "RFP-9821", "TEST-PING-1"].includes(r.id)) return false;
      if (r.id.startsWith('USER-PROFILE-') || String(r.id).startsWith('REV-') || String(r.title || '').startsWith('CREATOR_REVIEW:') || r.status === 'CERTIFIED_REVIEW') return false;
      if (r.isRejected || r.isDeleted || r.isCompleted || r.isClosed || r.isDelivered) return false;

      const reqClientEmail = (r.clientEmail || r.client_email || '').toLowerCase().trim();
      const reqClientId = (r.userId || r.client_id || '').toLowerCase().trim();
      const isSelfOrder = Boolean(
        (myMakerEmail && reqClientEmail && reqClientEmail === myMakerEmail) ||
        (myMakerUid && reqClientId && reqClientId === myMakerUid)
      );
      if (isSelfOrder) return false;

      if (r.isAccepted === true) return false;
      if (r.maker || r.maker_name || r.makerUserId || r.assigned_creator_id || (r.acceptedBy && String(r.acceptedBy).trim() !== '')) return false;

      const st = String(r.status || '').toLowerCase().trim();
      const isOpen = (st === 'open' || st === 'in attesa' || st === 'aperta' || st.includes('attesa creator') || st.includes('waiting for creator'));
      if (!isOpen) return false;

      return true;
    });

    console.log(tu.label, '-> Visible requests:', visible.map(v => v.id));
  });
}

test().catch(console.error);
