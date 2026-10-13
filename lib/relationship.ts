import "server-only";
import { cache } from "react";
import { requireUser } from "./session";
import { displayName } from "./access";
// Resolve the actual two members at request time. No names or personal history in source code.
export const relationship = cache(async () => {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,display_name");
  if (error || data?.length !== 2)
    throw new Error("Your shared space could not be loaded.");
  const me = data.find((p) => p.id === user.id),
    partner = data.find((p) => p.id !== user.id);
  if (!me || !partner)
    throw new Error("Your shared space could not be loaded.");
  return {
    supabase,
    user,
    myName: displayName(me.email, me.display_name),
    partnerName: displayName(partner.email, partner.display_name),
    partnerId: partner.id,
    names: Object.fromEntries(
      data.map((p) => [p.id, displayName(p.email, p.display_name)]),
    ),
  };
});
