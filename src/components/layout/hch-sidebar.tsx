"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
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
import { HomeIcon, ExternalLinkIcon, MessageCircleIcon, BookMarkedIcon } from "lucide-react"
import { getGroups } from "@/app/actions/notebook"
import type { NotebookGroup } from "@/core/notebook-types"
import { Skeleton } from "@/components/ui/skeleton"
import pkg from "../../../package.json"

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

interface HchSidebarProps extends React.ComponentProps<typeof Sidebar> {
  initialGroups?: NotebookGroup[]
}

export function HchSidebar({ initialGroups, ...props }: HchSidebarProps) {
  const { isSignedIn, isLoaded } = useAuth()
  const pathname = usePathname()
  const [groups, setGroups] = useState<NotebookGroup[]>(initialGroups ?? [])
  const [groupsLoading, setGroupsLoading] = useState(!initialGroups)

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setGroupsLoading(true)
      getGroups().then(setGroups).catch(() => {}).finally(() => setGroupsLoading(false))
    } else if (isLoaded) {
      setGroups([])
      setGroupsLoading(false)
    }
  }, [isLoaded, isSignedIn])

  const navMain = [
    {
      title: "Trang chủ",
      url: "/",
      icon: <HomeIcon />,
      isActive: pathname === "/",
      items: [],
    },
    {
      title: "Sổ tay",
      url: "/notebook",
      icon: <BookMarkedIcon />,
      isActive: pathname.startsWith("/notebook"),
      loading: groupsLoading,
      items: groups.map((g) => ({ title: g.title, url: `/notebook/${g.slug}` })),
    },
  ]

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
