"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // UNE SEULE redirection, via useEffect
  useEffect(() => {
    if (!loading && user) {
      const nextUrl = searchParams.get("next");
      if (nextUrl) {
        router.replace(nextUrl);
      } else if (user.role === "admin") {
        router.replace("/admin");
      } else if (user.role === "writer") {
        router.replace("/writer");
      }
    }
  }, [user, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Remplissez tous les champs.");
      return;
    }
    setSubmitting(true);
    setError("");

    const { error: err } = await login(email, password);
    if (err) {
      setError(err);
      setSubmitting(false);
    }
    //  Ne pas rediriger ici → le useEffect le fait automatiquement
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9fb]">
        <Loader2 size={22} className="animate-spin text-gray-300" />
      </div>
    );

  //  Afficher un loader si l'utilisateur est déjà connecté
  if (user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9fb]">
        <Loader2 size={22} className="animate-spin text-[#c9a84c]" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f9f9fb] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[#1c1c2e] mb-4">
            <ShieldCheck size={22} className="text-[#c9a84c]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Espace Collaborateurs</h1>
          <p className="text-gray-600 mt-2">
            Cet espace est réservé aux écrivains et administrateurs autorisés.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">
                Adresse email
              </Label>
              <Input
                type="email"
                autoComplete="email"
                placeholder="admin@exemple.com"
                className="h-9 text-sm"
                value={email}
                disabled={submitting}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-9 text-sm pr-9"
                  value={password}
                  disabled={submitting}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPwd((v) => !v)}
                >
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="text-[11px] text-red-600">{error}</p>
              </div>
            )}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-9 text-sm bg-[#1c1c2e] hover:bg-[#1c1c2e]/90 text-white"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Connexion...
                </span>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-xs text-blue-900">
            <span className="font-semibold">💡 Info :</span> Pour accéder à cet
            espace, contactez votre administrateur.
          </p>
        </div>

        <p className="text-center text-[10px] text-gray-300 mt-6">
          Accès réservé aux administrateurs et écrivains autorisés.
        </p>
      </div>
    </div>
  );
}