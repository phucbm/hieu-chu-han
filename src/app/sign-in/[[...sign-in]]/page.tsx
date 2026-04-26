"use client";

import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 gap-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors self-start max-w-[400px] w-full"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </button>
      <SignIn />
    </div>
  );
}
