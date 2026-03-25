#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// import-letters.js — import historical emails into the letters app
//
// HOW TO RUN:
//   1. Open Terminal and navigate to your letters project folder
//   2. Run: npm install mailparser
//   3. Run: node import-letters.js /path/to/Personal-letters-export.mbox
//
// WHAT IT DOES:
//   - Reads your mbox file
//   - Shows you a numbered list of every email found
//   - Lets you pick which ones to skip
//   - Imports the rest into Supabase as letters
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')
const readline = require('readline')

// ── Config — filled from your .env.local automatically ───────────────────────
require('dotenv').config({ path: path.join(__dirname, '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const YOUR_EMAIL = process.env.ALLOWED_EMAIL_1?.toLowerCase()
const HER_EMAIL = process.env.ALLOWED_EMAIL_2?.toLowerCase()

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const mboxPath = process.argv[2]

  if (!mboxPath) {
    console.error('\nUsage: node import-letters.js /path/to/Personal-letters-export.mbox\n')
    process.exit(1)
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('\nMissing SUPABASE_SERVICE_ROLE_KEY in .env.local')
    console.error('Add this line to your .env.local file:')
    console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here\n')
    process.exit(1)
  }

  if (!YOUR_EMAIL || !HER_EMAIL) {
    console.error('\nMissing ALLOWED_EMAIL_1 or ALLOWED_EMAIL_2 in .env.local\n')
    process.exit(1)
  }

  console.log(`\nReading ${path.basename(mboxPath)}...`)
  const content = fs.readFileSync(mboxPath, 'utf-8')

  // Split into individual messages
  const rawMessages = content.split(/^From /m).filter(Boolean).map(m => 'From ' + m)
  console.log(`Found ${rawMessages.length} raw messages, parsing...`)

  // Parse with mailparser
  const { simpleParser } = require('mailparser')
  const emails = []

  for (const raw of rawMessages) {
    try {
      const mail = await simpleParser(raw, { skipHtmlToText: false })
      const from = mail.from?.value?.[0]?.address?.toLowerCase()
      const to = (mail.to?.value?.[0]?.address || mail.to?.value?.[1]?.address || '')?.toLowerCase()
      const date = mail.date
      const subject = mail.subject || null

      // Skip if not between our two users
      const isOurs =
        (from === YOUR_EMAIL || from === HER_EMAIL) &&
        (to === YOUR_EMAIL || to === HER_EMAIL)
      if (!isOurs || !date) continue

      // Extract body — prefer plain text, strip quoted history
      let body = mail.text || ''
      body = stripQuoted(body)
      if (!body.trim()) continue

      emails.push({ from, to, date, subject, body: body.trim() })
    } catch {
      // skip unparseable messages
    }
  }

  // Sort oldest first
  emails.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (emails.length === 0) {
    console.error('\nNo emails found between your two addresses. Check ALLOWED_EMAIL_1 and ALLOWED_EMAIL_2 in .env.local match the emails in the mbox file.\n')
    process.exit(1)
  }

  // Show preview
  console.log('\n' + '─'.repeat(72))
  emails.forEach((m, i) => {
    const d = new Date(m.date).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
    const from = m.from === YOUR_EMAIL ? 'you' : 'Azi'
    const preview = m.body.substring(0, 55).replace(/\n/g, ' ')
    console.log(`${String(i + 1).padStart(3)}. [${d}] ${from.padEnd(3)} — ${preview}…`)
  })
  console.log('─'.repeat(72))
  console.log(`\nTotal: ${emails.length} letters\n`)

  // Ask which to skip
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const answer = await ask(rl, 'Enter numbers to SKIP (comma-separated), or press Enter to import all: ')
  rl.close()

  const skipNums = new Set(
    answer.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
  )
  const toImport = emails.filter((_, i) => !skipNums.has(i + 1))
  console.log(`\nImporting ${toImport.length} letters into Supabase...`)

  // Connect to Supabase with service role key (bypasses RLS for import)
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Ensure both profiles exist (creates Azi's account silently if needed)
  await ensureProfiles(supabase)

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email')

  if (profileError || !profiles) {
    console.error('Could not fetch profiles:', profileError?.message)
    process.exit(1)
  }

  const me = profiles.find(p => p.email.toLowerCase() === YOUR_EMAIL)
  const her = profiles.find(p => p.email.toLowerCase() === HER_EMAIL)

  if (!me) { console.error(`\nCould not find your profile (${YOUR_EMAIL}). Make sure you have signed in at least once.\n`); process.exit(1) }
  if (!her) { console.error(`\nCould not find Azi's profile. The script should have created it — check Supabase Auth tab.\n`); process.exit(1) }

  // Insert letters
  let success = 0
  let failed = 0

  for (const m of toImport) {
    const fromId = m.from === YOUR_EMAIL ? me.id : her.id
    const toId = fromId === me.id ? her.id : me.id

    const { error } = await supabase.from('letters').insert({
      from_id: fromId,
      to_id: toId,
      subject: m.subject,
      body: m.body,
      sent_at: m.date.toISOString(),
      read_at: m.date.toISOString(), // historical — mark as already read
    })

    if (error) {
      console.error(`  ✗ Failed: ${m.subject || '(no subject)'}`, error.message)
      failed++
    } else {
      success++
      process.stdout.write(`\r  Imported ${success}/${toImport.length}...`)
    }
  }

  console.log(`\n\nDone! ${success} letters imported.${failed > 0 ? ` ${failed} failed.` : ''}`)
  console.log('Open https://lettersforus.vercel.app/letters to see them.\n')
}

// ── Silently create Azi's account if she hasn't signed in yet ─────────────────
async function ensureProfiles(supabase) {
  const { data: existing } = await supabase.from('profiles').select('email')
  const emails = (existing || []).map(p => p.email.toLowerCase())

  if (!emails.includes(HER_EMAIL)) {
    console.log(`\nCreating Azi's account silently (she won't receive any email)...`)
    const { error } = await supabase.auth.admin.createUser({
      email: HER_EMAIL,
      email_confirm: true, // no confirmation email sent
    })
    if (error && !error.message.includes('already')) {
      console.error('Could not create her account:', error.message)
    } else {
      console.log('Account created.\n')
    }
  }
}

// ── Strip quoted reply history from email body ────────────────────────────────
function stripQuoted(text) {
  if (!text) return ''
  const lines = text.split('\n')
  const result = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Stop at quoted lines
    if (line.startsWith('>')) break
    // Stop at "On [date]...wrote:" patterns
    if (/^On .{10,100}wrote:$/.test(line.trim())) break
    // Stop at Gmail's "---------- Forwarded message ---------"
    if (line.includes('---------- Forwarded')) break
    result.push(line)
  }

  // Trim trailing blank lines
  while (result.length > 0 && result[result.length - 1].trim() === '') {
    result.pop()
  }

  return result.join('\n')
}

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve))
}

main().catch(err => {
  console.error('\nError:', err.message)
  process.exit(1)
})
