export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {children}
    </main>
  );
}