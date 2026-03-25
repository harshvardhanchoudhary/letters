#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// import-letters.js — import historical emails into the letters app
//
// HOW TO RUN:
//   node import-letters.js /path/to/Personal-letters-export.mbox
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')
const readline = require('readline')

require('dotenv').config({ path: path.join(__dirname, '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const YOUR_EMAIL = process.env.ALLOWED_EMAIL_1?.toLowerCase()
const HER_EMAIL = process.env.ALLOWED_EMAIL_2?.toLowerCase()

async function main() {
  const mboxPath = process.argv[2]
  if (!mboxPath) { console.error('\nUsage: node import-letters.js /path/to/file.mbox\n'); process.exit(1) }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) { console.error('\nMissing keys in .env.local\n'); process.exit(1) }

  console.log(`\nReading ${path.basename(mboxPath)} (streaming — this may take a minute)...`)

  // Stream the file line by line, splitting into individual messages
  const messages = await streamMbox(mboxPath)
  console.log(`Found ${messages.length} raw messages, parsing...`)

  const { simpleParser } = require('mailparser')
  const emails = []

  for (let i = 0; i < messages.length; i++) {
    process.stdout.write(`\r  Parsing ${i + 1}/${messages.length}...`)
    try {
      const mail = await simpleParser(messages[i])
      const from = mail.from?.value?.[0]?.address?.toLowerCase()
      const toList = Array.isArray(mail.to?.value) ? mail.to.value : []
      const to = toList.find(t =>
        t.address?.toLowerCase() === YOUR_EMAIL ||
        t.address?.toLowerCase() === HER_EMAIL
      )?.address?.toLowerCase()

      const date = mail.date
      const subject = mail.subject || null

      const isOurs =
        (from === YOUR_EMAIL || from === HER_EMAIL) &&
        (to === YOUR_EMAIL || to === HER_EMAIL)
      if (!isOurs || !date) continue

      let body = mail.text || ''
      body = stripQuoted(body)
      if (!body.trim()) continue

      emails.push({ from, to, date, subject, body: body.trim() })
    } catch {
      // skip unparseable
    }
  }

  console.log('')
  emails.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (emails.length === 0) {
    console.error('\nNo emails found between your two addresses.')
    console.error(`Looking for: ${YOUR_EMAIL} ↔ ${HER_EMAIL}`)
    console.error('Check these match exactly what is in the mbox file.\n')
    process.exit(1)
  }

  console.log(`\nFound ${emails.length} letters. Review each one:\n`)

  const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout })
  const toImport = []

  for (let i = 0; i < emails.length; i++) {
    const m = emails[i]
    const d = new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    const from = m.from === YOUR_EMAIL ? 'you' : 'her'
    const bodyPreview = m.body.substring(0, 200).replace(/\n+/g, ' ').trim()

    console.log('\n' + '─'.repeat(72))
    console.log(`[${i + 1}/${emails.length}]  ${d}  •  from: ${from}`)
    if (m.subject) console.log(`Subject: ${m.subject}`)
    console.log(`\n${bodyPreview}${m.body.length > 200 ? '...' : ''}`)
    console.log('')

    let answer = ''
    while (!['y', 'n', 's'].includes(answer)) {
      answer = (await ask(rl2, 'Import this letter? [y = yes / n = skip / s = stop & import what we have so far]: ')).trim().toLowerCase()
    }

    if (answer === 'y') toImport.push(m)
    if (answer === 's') break
  }

  rl2.close()
  console.log('')
  console.log(`\nImporting ${toImport.length} letters into Supabase...`)

  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  await ensureProfiles(supabase)

  const { data: profiles } = await supabase.from('profiles').select('id, email')
  const me = profiles?.find(p => p.email.toLowerCase() === YOUR_EMAIL)
  const her = profiles?.find(p => p.email.toLowerCase() === HER_EMAIL)

  if (!me) { console.error(`\nCould not find your profile (${YOUR_EMAIL}). Make sure you have signed in.\n`); process.exit(1) }
  if (!her) { console.error(`\nCould not find her profile. Try running the script again.\n`); process.exit(1) }

  let success = 0, failed = 0
  for (const m of toImport) {
    const fromId = m.from === YOUR_EMAIL ? me.id : her.id
    const toId = fromId === me.id ? her.id : me.id

    const { error } = await supabase.from('letters').insert({
      from_id: fromId,
      to_id: toId,
      subject: m.subject,
      body: m.body,
      sent_at: m.date.toISOString(),
      read_at: m.date.toISOString(),
    })

    if (error) { console.error(`  ✗ Failed: ${m.subject}`, error.message); failed++ }
    else { success++; process.stdout.write(`\r  Imported ${success}/${toImport.length}...`) }
  }

  console.log(`\n\nDone! ${success} letters imported.${failed > 0 ? ` ${failed} failed.` : ''}`)
  console.log('Open https://lettersforus.vercel.app/letters to see them.\n')
}

// Stream the mbox file line by line — handles files of any size
async function streamMbox(filePath) {
  return new Promise((resolve, reject) => {
    const messages = []
    let current = []
    let started = false

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding: 'utf-8' }),
      crlfDelay: Infinity
    })

    rl.on('line', line => {
      if (line.startsWith('From ')) {
        if (started && current.length > 0) {
          messages.push(current.join('\n'))
        }
        current = [line]
        started = true
      } else if (started) {
        current.push(line)
      }
    })

    rl.on('close', () => {
      if (current.length > 0) messages.push(current.join('\n'))
      resolve(messages)
    })

    rl.on('error', reject)
  })
}

async function ensureProfiles(supabase) {
  const { data: existing } = await supabase.from('profiles').select('email')
  const emails = (existing || []).map(p => p.email.toLowerCase())

  if (!emails.includes(HER_EMAIL)) {
    console.log(`\nCreating her account silently...`)
    const { error } = await supabase.auth.admin.createUser({
      email: HER_EMAIL,
      email_confirm: true,
    })
    if (error && !error.message.includes('already')) {
      console.error('Could not create her account:', error.message)
    }
  }
}

function stripQuoted(text) {
  if (!text) return ''
  const lines = text.split('\n')
  const result = []
  for (const line of lines) {
    if (line.startsWith('>')) break
    if (/^On .{10,100}wrote:$/.test(line.trim())) break
    if (line.includes('---------- Forwarded')) break
    result.push(line)
  }
  while (result.length > 0 && result[result.length - 1].trim() === '') result.pop()
  return result.join('\n')
}

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve))
}

main().catch(err => { console.error('\nError:', err.message); process.exit(1) })
