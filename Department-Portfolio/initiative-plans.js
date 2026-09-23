/* Shared initiative plans displayed in the English Department Portfolio. */
(function () {
  const list = document.getElementById('initiativePlanList');
  if (!list) return;
  const names = [
    'Reading Enrichment Activities', 'Creative Storytelling', 'Online Reading Practice',
    'Vocabulary Development', 'Quick Writing Activities', 'Write to Lead Program',
    '16-Square Spelling Test', 'Paragraph Expert Groups',
    'Weekly Differentiated Reading Comprehension Lessons', 'Station-Based Reading Activities',
    'Vocabulary and Spelling Tests', 'Essay Writing Tasks',
    'Educational Videos and Differentiated Worksheets', 'Kutubi Reading Platform',
    'Weekly Differentiated Writing Tasks', 'Daily Independent Reading',
    'Reading Summaries', 'Wayground Reading and Language Practice', 'ALEF Program'
  ];
  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  let loading = false;
  let evidenceFiles = [];
  list.addEventListener('click', async event => {
    const button = event.target.closest('[data-initiative-evidence]');
    if (!button) return;
    const file = evidenceFiles.find(item => String(item.id) === button.dataset.initiativeEvidence);
    if (!file) return;
    const { data, error } = await parent.portfolioSupabase.storage.from('portfolio-files').createSignedUrl(file.storage_path, 300);
    if (error) return alert('Could not open this evidence file.');
    window.open(data.signedUrl, '_blank', 'noopener');
  });
  async function refresh() {
    if (loading) return;
    const client = parent.portfolioSupabase;
    if (!client || !parent.PORTFOLIO_USER) {
      list.textContent = 'Sign in to view the department initiative plans.';
      setTimeout(refresh, 700);
      return;
    }
    loading = true;
    list.textContent = 'Loading plans…';
    try {
      const verified = await client.auth.getUser();
      if (verified.error || !verified.data.user) {
        list.textContent = 'Sign in to view the department initiative plans.';
        return;
      }
      const { data, error } = await client.from('english_initiative_polls')
        .select('user_id,teacher_name,initiative_id,description,timeline,target_students,actions,measure,updated_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      const uploads = await client.from('portfolio_uploads')
        .select('id,owner_id,title,file_name,storage_path,metadata')
        .eq('category', 'Initiative Plan').order('created_at', { ascending: false });
      if (uploads.error) throw uploads.error;
      evidenceFiles = uploads.data || [];
      const rows = data || [];
      if (!rows.length) {
        list.innerHTML = '<p style="margin:0;color:#687e89">No initiative plans have been submitted yet.</p>';
        return;
      }
      list.innerHTML = '<p style="color:#687e89;font-size:13px;margin:0 0 12px">' + rows.length + ' plan' + (rows.length === 1 ? '' : 's') + ' shared · Select a plan to read its details.</p>' +
        '<div style="display:grid;gap:10px">' + rows.map(row => {
          const title = names[row.initiative_id - 1] || 'Initiative';
          const date = row.updated_at ? new Date(row.updated_at).toLocaleDateString('en-GB') : '';
          const files = evidenceFiles.filter(item => item.owner_id === row.user_id);
          return '<details style="border:1px solid #d8e3e8;border-radius:12px;background:#fbfdfd;padding:13px 15px">' +
            '<summary style="cursor:pointer;line-height:1.5;color:#17324d"><b>' + safe(title) + '</b><span style="display:block;color:#687e89;font-size:13px">' + safe(row.teacher_name) + (date ? ' · Updated ' + safe(date) : '') + '</span></summary>' +
            '<div style="margin-top:13px;border-top:1px solid #e2e9ec;padding-top:11px;display:grid;gap:10px;line-height:1.55;font-size:14px">' +
            [['Description', row.description], ['Timeline', row.timeline], ['Target students', row.target_students], ['Actions and responsibilities', row.actions], ['How impact will be measured', row.measure]]
              .map(([label, value]) => '<div><b>' + label + '</b><div style="white-space:pre-wrap;color:#425b6c">' + safe(value) + '</div></div>').join('') +
            '<div><b>Evidence</b><div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:6px">' + (files.length ? files.map(file => '<button type="button" class="btn" data-initiative-evidence="' + safe(file.id) + '">📎 ' + safe(file.title || file.file_name || 'Evidence file') + '</button>').join('') : '<span style="color:#687e89">No files uploaded yet.</span>') + '</div></div>' +
            '</div></details>';
        }).join('') + '</div>';
    } catch (error) {
      list.textContent = 'Could not load the plans. Please try Refresh plans.';
      console.error('Initiative plan loading failed:', error);
    } finally {
      loading = false;
    }
  }
  window.refreshInitiativePlans = refresh;
  window.addEventListener('focus', refresh);
  refresh();
})();
