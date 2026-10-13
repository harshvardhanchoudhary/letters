"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type Result = { error?: string; success?: boolean };
export function ActionForm({
  action,
  children,
  className,
  reset = false,
}: {
  action: (form: FormData) => Promise<Result>;
  children: React.ReactNode;
  className?: string;
  reset?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [failed, setFailed] = useState(false);
  const router = useRouter();
  return (
    <form
      className={className}
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        const form = e.currentTarget;
        setBusy(true);
        setMessage("");
        try {
          const result = await action(new FormData(form));
          setFailed(!!result.error);
          setMessage(result.error || "Saved to your journal.");
          if (result.success) {
            if (reset) form.reset();
            router.refresh();
          }
        } catch {
          setFailed(true);
          setMessage("Could not save. Your text is still here; try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <fieldset
        disabled={busy}
        style={{ border: 0, padding: 0, margin: 0, display: "contents" }}
      >
        {children}
      </fieldset>
      {busy && (
        <p role="status" className="status">
          Saving…
        </p>
      )}
      {message && (
        <p
          role={failed ? "alert" : "status"}
          className={failed ? "error" : "status"}
        >
          {message}
        </p>
      )}
    </form>
  );
}
