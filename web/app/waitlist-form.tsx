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
        className="flex-1 rounded-lg border border-black/10 px-4 py-3 text-base outline-none focus:border-black/30 dark:border-white/15 dark:bg-zinc-900 dark:focus:border-white/40"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-foreground px-6 py-3 text-base font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {pending ? "등록 중..." : "웨이트리스트 등록"}
      </button>
      {state.message && (
        <p
          role="status"
          className={`sm:col-span-2 text-sm ${
            state.status === "error" ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
