import DashboardLayout from "@/components/layout/DashboardLayout";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}