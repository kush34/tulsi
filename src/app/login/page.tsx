import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const callback = params?.callbackUrl
    ? `?callbackUrl=${encodeURIComponent(params.callbackUrl)}`
    : "";
  redirect(`/en/auth${callback}`);
}
