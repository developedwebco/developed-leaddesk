// ============================================================================
// Pure Node.js GitHub Private Repository Creator & Pusher (No Git Required)
// Creates private repo "delveloped-leaddesk" and commits all project files
// ============================================================================

const fs = require('fs');
const path = require('path');
const https = require('https');

const ORG_NAME = process.env.GITHUB_ORG || 'developedwebco';
const REPO_NAME = process.env.GITHUB_REPO || 'developed-leaddesk';
const TOKEN = process.argv[2] || process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error('Usage: node push-to-github.js <YOUR_GITHUB_TOKEN>');
  process.exit(1);
}

function ghRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: 'api.github.com',
        path: endpoint,
        method,
        headers: {
          'User-Agent': 'DevEloped-LeadDesk-Pusher',
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
        }
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
          else reject(new Error(`GitHub API ${res.statusCode} on ${endpoint}: ${parsed.message || data}`));
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function walkFiles(dir, baseDir = dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.wrangler', 'android'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walkFiles(full, baseDir));
    } else {
      results.push({
        relPath: path.relative(baseDir, full).replace(/\\/g, '/'),
        content: fs.readFileSync(full, 'utf8')
      });
    }
  }
  return results;
}

(async () => {
  try {
    const user = await ghRequest('GET', '/user');
    const owner = ORG_NAME || user.login;
    console.log(`Authenticated as GitHub user: ${user.login} -> Target Org/Owner: ${owner}`);

    // 1. Create or get organization repository
    let repo;
    try {
      repo = await ghRequest('GET', `/repos/${owner}/${REPO_NAME}`);
      console.log(`Using existing organization repository: ${repo.html_url}`);
    } catch (err) {
      repo = await ghRequest('POST', `/orgs/${owner}/repos`, {
        name: REPO_NAME,
        description: 'DevEloped LeadDesk — Outbound Cold-Call & Website Sales CRM for DevEloped Web Co.',
        private: true,
        auto_init: true
      });
      console.log(`Created new organization repository: ${repo.html_url}`);
      await new Promise(r => setTimeout(r, 1500));
    }

    // 2. Upload all project files via Contents API
    const files = walkFiles(__dirname);
    for (const f of files) {
      let existingSha = undefined;
      try {
        const ex = await ghRequest('GET', `/repos/${owner}/${REPO_NAME}/contents/${f.relPath}`);
        existingSha = ex.sha;
      } catch (_) {}

      await ghRequest('PUT', `/repos/${owner}/${REPO_NAME}/contents/${f.relPath}`, {
        message: `Add/update ${f.relPath}`,
        content: Buffer.from(f.content, 'utf8').toString('base64'),
        ...(existingSha ? { sha: existingSha } : {})
      });
      console.log(` ✓ Pushed ${f.relPath}`);
    }

    console.log(`\n🎉 SUCCESS! All ${files.length} files pushed to private repo: https://github.com/${owner}/${REPO_NAME}`);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
})();
