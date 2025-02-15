"use server";

import Link from "next/link";
import { CircleUser } from "lucide-react";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import OrganizationSwitcher from "@/components/dashboard/OrganizationSwitcher";
import { OrganizationProvider } from "@/components/dashboard/OrganizationProvider";
import { Searchbar } from "@/components/dashboard/Searchbar";
import { Notifications } from "@/components/dashboard/Notifications";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Image from "next/image";


export async function DashboardHeader() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <OrganizationProvider />
      
      <div className="flex-1 ml-4">
        <Searchbar />
      </div>

      <div className="ml-auto flex items-center gap-x-5">
        <OrganizationSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Image
              src={user?.picture as string} 
              alt="User" 
              width={32} 
              height={32} 
              className="rounded-full"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                href="https://billing.stripe.com/p/login/7sIbKj5DHb1P2sw8ww"
                target="_blank"
              >
                Manage Subscription
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <LogoutLink>Log out</LogoutLink>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Notifications />
        <ThemeToggle />
      </div>
    </header>
  );
}
