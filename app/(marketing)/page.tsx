import { Button } from "@/components/ui/button";
import {
  RegisterLink,
  LoginLink,
  LogoutLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Hero } from "@/components/frontend/Hero";
import { Logos } from "@/components/frontend/Logos";
import { Features } from "@/components/frontend/Features";
import { redirect } from "next/navigation";
import { SocialProof } from "@/components/frontend/SocialProof";


export default async function Home() {
  const { getUser } = getKindeServerSession();
  const session = await getUser();


  if (session?.id) {
    return redirect("/dashboard");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
      <Hero />
      <Logos />
      <Features />
      <SocialProof />
    </div>
  );
}
