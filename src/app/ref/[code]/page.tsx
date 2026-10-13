import { redirect } from "next/navigation";

export default async function ReferralLandingPage({ params }: PageProps<"/ref/[code]">) {
  const { code } = await params;
  redirect(`/register?ref=${encodeURIComponent(code)}`);
}
