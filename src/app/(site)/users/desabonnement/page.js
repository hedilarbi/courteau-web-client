import UnsubscribeContent from "./UnsubscribeContent";

export const metadata = {
  title: "Désabonnement",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({ searchParams }) {
  const params = await searchParams;
  const email = typeof params?.email === "string" ? params.email.trim() : "";
  return <UnsubscribeContent email={email} />;
}
