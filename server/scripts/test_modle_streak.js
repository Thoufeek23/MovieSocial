#!/usr/bin/env node
/*
  Usage:
    node server/scripts/test_modle_streak.js <API_BASE_URL> <BEARER_TOKEN>

  Example:
    node server/scripts/test_modle_streak.js http://localhost:5001 eyJhbGci...

  The script posts an incorrect guess, fetches status, then posts a correct guess
  (upgrade) and fetches status again. It prints the responses so you can verify
  that the day's entry becomes correct and that streak increments to 1.
*/

(async () => {
  // minimal fetch polyfill note: Node 18+ has global fetch. If you run older Node,
  // install node-fetch: npm install node-fetch
  if (typeof fetch === 'undefined') {
    try {
      global.fetch = require('node-fetch');
    } catch (e) {
      console.error('fetch not available. Run with Node 18+ or install node-fetch (npm i node-fetch).');
      process.exit(1);
    }
  }

  const [,, apiBase, token] = process.argv;
  if (!apiBase || !token) {
    console.error('Usage: node server/scripts/test_modle_streak.js <API_BASE_URL> <BEARER_TOKEN>');
    process.exit(2);
  }

  const base = apiBase.replace(/\/$/, '');
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  const today = new Date().toISOString().slice(0,10);

  async function postResult(body) {
    const res = await fetch(`${base}/api/users/modle/result`, { method: 'POST', headers, body: JSON.stringify(body) });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = text; }
    return { status: res.status, data };
  }

  async function getStatus(language = 'English') {
    const res = await fetch(`${base}/api/users/modle/status?language=${encodeURIComponent(language)}`, { method: 'GET', headers });
    const data = await res.json();
    return { status: res.status, data };
  }

  console.log('Today (UTC):', today);
  console.log('--- POST incorrect guess ---');
  let r = await postResult({ date: today, language: 'English', correct: false, guesses: ['WRONGGUESS'] });
  console.log('POST incorrect ->', r.status, JSON.stringify(r.data, null, 2));

  console.log('\n--- GET language status (after incorrect) ---');
  console.log(JSON.stringify(await getStatus('English'), null, 2));

  console.log('\n--- POST correct guess (upgrade) ---');
  r = await postResult({ date: today, language: 'English', correct: true, guesses: ['THECORRECTTITLE'] });
  console.log('POST correct ->', r.status, JSON.stringify(r.data, null, 2));

  console.log('\n--- GET language status (after correct) ---');
  console.log(JSON.stringify(await getStatus('English'), null, 2));

  console.log('\n--- GET global status (after correct) ---');
  console.log(JSON.stringify(await getStatus('global'), null, 2));

  process.exit(0);
})();
