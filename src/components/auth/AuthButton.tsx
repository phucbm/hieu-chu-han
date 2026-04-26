"use client";

import { useAuth, useUser, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

/**
 * AuthButton — Shows UserButton when signed in, sign-in/up buttons when signed out.
 * Used in both AppSidebar (desktop) and AppHeader (mobile).
 */
export function AuthButton() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  if (!isLoaded) return null;

  if (isSignedIn) {
    const name = user?.firstName ?? user?.username ?? user?.emailAddresses[0]?.emailAddress ?? "";
    return (
      <div className="flex items-center gap-2">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
            },
          }}
        />
        {name && <span className="text-sm truncate max-w-[120px]">{name}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="redirect">
        <Button variant="ghost" size="sm" className="gap-1.5 text-sm">
          <LogIn className="h-4 w-4" />
          Đăng nhập
        </Button>
      </SignInButton>
      <SignUpButton mode="redirect">
        <Button variant="default" size="sm" className="text-sm">
          Đăng ký
        </Button>
      </SignUpButton>
    </div>
  );
}
