"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Brush, ExternalLink, Grid2X2, Images, LogOut, Menu, QrCode, Settings, SlidersHorizontal } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAdminUiStore } from "@/stores/admin-ui-store";
import { useBusinessStore } from "@/stores/business-store";

const navigation = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/branding", label: "Branding", icon: Brush },
  { href: "/admin/theme", label: "Theme", icon: SlidersHorizontal },
  { href: "/admin/templates", label: "Templates", icon: Grid2X2 },
  { href: "/admin/social-qr", label: "Social QR", icon: QrCode },
  { href: "/admin/sessions", label: "Sessions", icon: Images },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Admin navigation">
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} onClick={onNavigate} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring", active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground")}>
            <Icon className="size-4" />{label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const mobileNavigationOpen = useAdminUiStore((state) => state.mobileNavigationOpen);
  const setMobileNavigationOpen = useAdminUiStore((state) => state.setMobileNavigationOpen);
  const businessName = useBusinessStore((state) => state.branding.name);
  const isConfigured = useBusinessStore((state) => state.isConfigured);

  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-5 text-sidebar-foreground lg:flex">
        <BrandMark inverse className="mb-10 text-2xl" />
        <NavLinks />
        <div className="mt-auto space-y-2">
          <Button nativeButton={false} render={<Link href="/" />} variant="ghost" className="h-11 w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"><ExternalLink /> Open booth</Button>
          <LogoutDialog />
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Sheet open={mobileNavigationOpen} onOpenChange={setMobileNavigationOpen}>
              <SheetTrigger render={<Button variant="outline" size="icon" aria-label="Open navigation" />}><Menu /></SheetTrigger>
              <SheetContent side="left" className="bg-sidebar text-sidebar-foreground">
                <SheetHeader><SheetTitle><BrandMark inverse className="text-2xl" /></SheetTitle><SheetDescription className="text-sidebar-foreground/60">Photobooth administration</SheetDescription></SheetHeader>
                <div className="px-4"><NavLinks onNavigate={() => setMobileNavigationOpen(false)} /></div>
              </SheetContent>
            </Sheet>
            <span className="text-sm font-bold">Admin</span>
          </div>
          <p className="hidden max-w-[55vw] truncate text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground lg:block">{businessName} / Booth control</p>
          <div className="flex items-center gap-3"><span className={cn("size-2 rounded-full", isConfigured ? "bg-emerald-500" : "bg-amber-500")} /><span className="text-xs font-bold">{isConfigured ? "Configured" : "Setup needed"}</span></div>
        </header>
        <main className="mx-auto max-w-[1280px] p-4 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}

function LogoutDialog() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" className="h-11 w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground" />}><LogOut /> Log out</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Leave admin mode?</DialogTitle><DialogDescription>Your secure admin session will end and you will return to the login screen.</DialogDescription></DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={() => void logout()}>Log out</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
