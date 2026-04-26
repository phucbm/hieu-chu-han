"use client"

import Image from "next/image"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { HchNavUser } from "@/components/layout/hch-nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { HomeIcon, ExternalLinkIcon, MessageCircleIcon } from "lucide-react"
import pkg from "../../../package.json"

const navMain = [
  {
    title: "Trang chủ",
    url: "/",
    icon: <HomeIcon />,
    isActive: true,
    items: [],
  },
]

const navSecondary = [
  {
    title: "GitHub",
    url: "https://github.com/phucbm/hieu-chu-han",
    icon: <ExternalLinkIcon />,
  },
  {
    title: "Discord",
    url: "https://discord.gg/Wnckq2KE",
    icon: <MessageCircleIcon />,
  },
]

export function HchSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="/" />}>
              <Image
                src="/icon.png"
                alt="Hiểu Chữ Hán"
                width={32}
                height={32}
                className="rounded-lg size-8 shrink-0"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Hiểu Chữ Hán</span>
                <span className="truncate text-xs text-muted-foreground">v{pkg.version}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <HchNavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
