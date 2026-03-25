// LEARN: Defining types for our database tables here means TypeScript
// will catch any typo or wrong field name throughout the whole app —
// before the code ever runs. Think of it as a safety net that costs nothing.

export type Profile = {
  id: string
  email: string
  display_name: string | null
  created_at: string
  updated_at: string
}

export type Letter = {
  id: string
  from_id: string
  to_id: string
  subject: string | null
  body: string
  sent_at: string
  read_at: string | null
  created_at: string
  // Joined from profiles table
  from_profile?: Pick<Profile, 'display_name' | 'email'>
  to_profile?: Pick<Profile, 'display_name' | 'email'>
}

export type Postcard = {
  id: string
  from_id: string
  to_id: string
  image_url: string
  caption: string | null
  sent_at: string
  read_at: string | null
  created_at: string
  from_profile?: Pick<Profile, 'display_name' | 'email'>
  to_profile?: Pick<Profile, 'display_name' | 'email'>
}

export type Moment = {
  id: string
  created_by: string
  title: string
  note: string | null
  occurred_at: string
  created_at: string
  creator_profile?: Pick<Profile, 'display_name' | 'email'>
}

export type Currently = {
  user_id: string
  label: string
  value: string
  updated_at: string
}

// Union type for timeline entries
export type TimelineEntry =
  | ({ kind: 'letter' } & Letter)
  | ({ kind: 'postcard' } & Postcard)
  | ({ kind: 'moment' } & Moment)
