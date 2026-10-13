import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";
const outsider = "33333333-3333-4333-8333-333333333333";

test("relaunch preserves legacy rows and enforces two-person privacy in PostgreSQL", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;
      create schema storage;
      create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text);
      alter table storage.objects enable row level security;
      create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1,'/') $$;
      grant usage on schema storage to anon, authenticated;
      grant all on storage.objects to anon, authenticated;
      create policy "Public can view photos" on storage.objects for select to public using(bucket_id='timeline-photos');
      create policy "Authenticated users can upload" on storage.objects for insert to authenticated with check(bucket_id='timeline-photos');
    `);
    const legacy = (await readFile("supabase/schema.sql", "utf8")).split(
      "-- ── Currently",
    )[0];
    await db.exec(legacy);
    await db.exec(`
      grant usage on schema public to anon, authenticated;
      grant all on all tables in schema public to anon, authenticated;
      insert into auth.users(id,email) values ('${alice}','alice@example.test'),('${bob}','bob@example.test');
      insert into public.letters(from_id,to_id,body) values ('${alice}','${bob}','Keep this original letter.');
      insert into storage.objects(bucket_id,name) values ('timeline-photos','original.jpeg');
      insert into public.postcards(from_id,to_id,image_url) values ('${alice}','${bob}','original.jpeg');
    `);
    await db.exec(await readFile("supabase/relaunch.sql", "utf8"));
    await db.exec(await readFile("supabase/photo-access.sql", "utf8"));
    const asUser = async (id: string) => {
      await db.exec(
        `reset role; set role authenticated; select set_config('request.jwt.claim.sub','${id}',false);`,
      );
    };
    const count = async (table: string) =>
      (await db.query<{ n: number }>(`select count(*)::int n from ${table}`))
        .rows[0].n;
    await asUser(alice);
    assert.equal(await count("letters"), 1);
    const saved = await db.query<{ id: string }>(
      `select public.save_checkin($1::jsonb) id`,
      [
        JSON.stringify({
          mood: "Tender",
          energy: "gentle",
          need: "Quiet",
          phase: "Rest",
          cycle_phase: "Luteal",
          note: "Private reflection",
          share_cycle: false,
          share_note: false,
        }),
      ],
    );
    assert.equal(await count("checkin_private"), 1);
    await db.exec(`insert into library_items(id,user_id,kind,title) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','${alice}','book','A book');
      insert into library_notes(item_id,user_id,body,is_private) values
      ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','${alice}','Private note',true),
      ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','${alice}','Shared note',false);
      insert into letter_drafts(user_id,body) values ('${alice}','Unsent');
      insert into plans(user_id,title) values ('${alice}','An idea');
      insert into storage.objects(bucket_id,name) values ('timeline-photos','${alice}/orphan.webp');`);
    await assert.rejects(
      db.exec(
        `insert into storage.objects(bucket_id,name) values ('timeline-photos','${bob}/spoof.webp')`,
      ),
    );
    await asUser(bob);
    assert.equal(await count("checkin_private"), 0);
    assert.equal(await count("letter_drafts"), 0);
    assert.equal(await count("library_notes"), 1);
    const shared = (
      await db.query<{ note: string; cycle_phase: string | null }>(
        "select note,cycle_phase from checkins",
      )
    ).rows[0];
    assert.deepEqual(shared, { note: "", cycle_phase: null });
    await assert.rejects(db.exec(`update letters set body='Tampered'`));
    await db.exec(`update letters set read_at=now()`);
    assert.equal(
      (await db.query("update plans set title='Tampered' returning id")).rows
        .length,
      0,
    );
    await assert.rejects(
      db.exec(
        `insert into checkin_private(id,user_id) values ('${saved.rows[0].id}','${bob}')`,
      ),
    );
    assert.equal(
      (await db.query(`delete from storage.objects returning id`)).rows.length,
      0,
    );
    await asUser(alice);
    assert.equal(
      (
        await db.query(
          `delete from storage.objects where name='${alice}/orphan.webp' returning id`,
        )
      ).rows.length,
      1,
    );
    assert.equal(await count("storage.objects"), 1);
    await db.exec(
      `reset role; insert into auth.users(id,email) values ('${outsider}','outsider@example.test');`,
    );
    await asUser(alice);
    assert.equal(await count("profiles"), 2);
    await assert.rejects(
      db.exec(
        `insert into letters(from_id,to_id,body) values ('${alice}','${outsider}','Must not send')`,
      ),
    );
    await asUser(outsider);
    for (const table of [
      "profiles",
      "letters",
      "postcards",
      "moments",
      "checkins",
      "checkin_private",
      "library_items",
      "library_notes",
      "plans",
      "letter_drafts",
      "storage.objects",
    ])
      assert.equal(await count(table), 0, table);
    await assert.rejects(
      db.exec(
        `insert into plans(user_id,title) values ('${outsider}','Intrusion')`,
      ),
    );
    await assert.rejects(
      db.exec(
        `insert into storage.objects(bucket_id,name) values ('timeline-photos','${outsider}/intrusion.webp')`,
      ),
    );
    await db.exec("reset role; set role anon;");
    assert.equal(await count("storage.objects"), 0);
    assert.equal(await count("letters"), 0);
    await db.exec("reset role;");
    assert.equal(
      (await db.query<{ body: string }>("select body from letters")).rows[0]
        .body,
      "Keep this original letter.",
    );
    assert.equal(await count("postcards"), 1);
  } finally {
    await db.close();
  }
});
