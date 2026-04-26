"use client"

import { useAuth, useUser, SignInButton, SignUpButton } from "@clerk/nextjs"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronsUpDownIcon, LogOutIcon, LogInIcon, UserPlusIcon } from "lucide-react"

export function HchNavUser() {
  const { isSignedIn, isLoaded, signOut } = useAuth()
  const { user } = useUser()
  const { isMobile } = useSidebar()

  if (!isLoaded) return null

  if (!isSignedIn) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SignInButton mode="redirect">
            <SidebarMenuButton size="sm">
              <LogInIcon />
              <span>Đăng nhập</span>
            </SidebarMenuButton>
          </SignInButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SignUpButton mode="redirect">
            <SidebarMenuButton size="sm">
              <UserPlusIcon />
              <span>Đăng ký</span>
            </SidebarMenuButton>
          </SignUpButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const name     = user?.firstName ?? user?.username ?? "Người dùng"
  const email    = user?.emailAddresses[0]?.emailAddress ?? ""
  const avatar   = user?.imageUrl ?? ""
  const initials = name.slice(0, 2).toUpperCase()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />}
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-xs text-muted-foreground">{email}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarImage src={avatar} alt={name} />
                    <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{name}</span>
                    <span className="truncate text-xs text-muted-foreground">{email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOutIcon />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
