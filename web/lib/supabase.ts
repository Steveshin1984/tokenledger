import { createClient } from "@supabase/supabase-js";

// 서버에서만 사용 (Server Action 안에서 호출). service role key는 절대 클라이언트로 노출하지 않는다.
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되어 있지 않습니다. web/.env.local을 확인하세요."
    );
  }

  return createClient(url, key);
}
