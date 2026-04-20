"use client";

import { useAuth, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

/**
 * AuthButton — Shows UserButton when signed in, sign-in/up buttons when signed out.
 * Used in both AppSidebar (desktop) and AppHeader (mobile).
 */
export function AuthButton() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-8 h-8",
          },
        }}
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <Button variant="ghost" size="sm" className="gap-1.5 text-sm">
          <LogIn className="h-4 w-4" />
          Đăng nhập
        </Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button variant="default" size="sm" className="text-sm">
          Đăng ký
        </Button>
      </SignUpButton>
    </div>
  );
}
