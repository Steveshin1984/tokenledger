"use server";

import { getSupabaseServerClient } from "@/lib/supabase";

export type WaitlistState = {
  status: "idle" | "success" | "error";
  message: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function joinWaitlist(
  _prevState: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!EMAIL_REGEX.test(email)) {
    return { status: "error", message: "올바른 이메일 주소를 입력해주세요." };
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return {
      status: "error",
      message: "서버 설정이 아직 완료되지 않았어요 (Supabase 환경변수 미설정).",
    };
  }

  const { error } = await supabase.from("waitlist").insert({ email });

  if (error) {
    // 이미 등록된 이메일 (unique 제약 위반)
    if (error.code === "23505") {
      return { status: "success", message: "이미 웨이트리스트에 등록되어 있어요!" };
    }
    return { status: "error", message: "등록 중 문제가 발생했어요. 잠시 후 다시 시도해주세요." };
  }

  return { status: "success", message: "등록 완료! 출시되면 가장 먼저 알려드릴게요." };
}
