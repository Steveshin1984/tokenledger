"use client";

import { useActionState } from "react";
import { joinWaitlist, type WaitlistState } from "./actions";

const initialState: WaitlistState = { status: "idle", message: "" };

export function WaitlistForm() {
  const [state, formAction, pending] = useActionState(joinWaitlist, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
      <input
        type="email"
        name="email"
        required
        placeholder="you@example.com"
        className="flex-1 rounded-lg border border-border bg-white/[0.03] px-4 py-3 font-mono text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/60"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-amber-400 disabled:opacity-50"
      >
        {pending ? "등록 중..." : "웨이트리스트 등록"}
      </button>
      {state.message && (
        <p
          role="status"
          className={`text-sm sm:col-span-2 ${state.status === "error" ? "text-red-400" : "text-emerald-400"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
