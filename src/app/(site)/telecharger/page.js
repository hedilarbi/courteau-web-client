import { headers } from "next/headers";
import { redirect } from "next/navigation";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.hedilarbi95.lecourteauclient";
const APP_STORE_URL =
  "https://apps.apple.com/us/app/casse-cro%C3%BBte-courteau/id6476014838";

export default async function TelechargerPage() {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";

  if (/android/i.test(userAgent)) {
    redirect(PLAY_STORE_URL);
  }

  redirect(APP_STORE_URL);
}
