import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <Image src="/logo.png" alt="PropView" width={72} height={24} className="h-6 w-auto" />
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/imoveis" className="hover:text-foreground transition-colors">Imóveis</Link>
            <Link href="/busca" className="hover:text-foreground transition-colors">Busca IA</Link>
            <Link href="/admin" className="hover:text-foreground transition-colors">Admin</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; 2026 PropView. Powered by AI.
          </p>
        </div>
      </div>
    </footer>
  );
}
