import Link from "next/link";
import { Boxes, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-white">
        <Boxes className="h-6 w-6" />
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-navy">Page introuvable</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        La page demandée n'existe pas ou a été déplacée. Revenez à l'accueil ou à votre espace.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/">
            <Home className="h-4 w-4" /> Accueil
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Connexion</Link>
        </Button>
      </div>
    </div>
  );
}
