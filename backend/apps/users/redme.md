# Module Utilisateur — Blog Django + Next.js

Deux rôles : **Admin** et **Écrivain (Writer)**.

---

## Structure des fichiers

```
backend/users/
  models.py        → Modèle User personnalisé + rôles
  serializers.py   → Sérialiseurs DRF
  permissions.py   → Permissions par rôle
  views.py         → Vues API (auth, profil, admin)
  urls.py          → Routes /api/
  admin.py         → Interface Django Admin

frontend/
  types/user.ts          → Types TypeScript
  lib/api.ts             → Client HTTP (fetch + refresh JWT)
  lib/auth-context.tsx   → Context React + hooks
  middleware.ts          → Protection des routes (Edge)
  components/RoleGuard.tsx → Garde côté client
```

---

## Backend — Installation

### 1. Dépendances

```bash
pip install djangorestframework djangorestframework-simplejwt pillow
```

### 2. settings.py

```python
INSTALLED_APPS = [
    ...
    "rest_framework",
    "users",   # votre app
]

AUTH_USER_MODEL = "users.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

from datetime import timedelta
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
}
```

### 3. urls.py (projet)

```python
from django.urls import path, include

urlpatterns = [
    path("api/", include("users.urls")),
]
```

### 4. Migrations

```bash
python manage.py makemigrations users
python manage.py migrate
python manage.py createsuperuser  # → role=admin automatiquement
```

---

## Frontend — Installation

### 1. Dépendances

```bash
npm install jwt-decode
```

### 2. Variables d'environnement (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 3. Ajouter AuthProvider dans layout.tsx

```tsx
import { AuthProvider } from "@/lib/auth-context";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

---

## Endpoints API

| Méthode | URL | Rôle | Description |
|---------|-----|------|-------------|
| POST | `/api/auth/register/` | Public | Inscription (→ Writer) |
| POST | `/api/auth/login/` | Public | Connexion (JWT) |
| POST | `/api/auth/refresh/` | Public | Renouveler le token |
| GET/PATCH | `/api/users/me/` | Authentifié | Profil perso |
| PATCH | `/api/users/me/password/` | Authentifié | Changer mot de passe |
| GET | `/api/authors/` | Public | Liste des auteurs |
| GET/POST | `/api/admin/users/` | Admin | Lister/créer comptes |
| GET/PATCH/DELETE | `/api/admin/users/{id}/` | Admin | Gérer un compte |
| POST | `/api/admin/users/{id}/activate/` | Admin | Activer |
| POST | `/api/admin/users/{id}/deactivate/` | Admin | Désactiver |
| POST | `/api/admin/users/{id}/promote/` | Admin | → Admin |
| POST | `/api/admin/users/{id}/demote/` | Admin | → Writer |

---

## Utilisation des composants

### Protection de page entière

```tsx
// app/admin/dashboard/page.tsx
import { RoleGuard } from "@/components/RoleGuard";

export default function AdminDashboard() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <h1>Tableau de bord Admin</h1>
    </RoleGuard>
  );
}
```

### Affichage conditionnel

```tsx
import { AdminOnly, WriterOnly } from "@/components/RoleGuard";

<AdminOnly>
  <button>Gérer les utilisateurs</button>
</AdminOnly>

<WriterOnly>
  <button>Nouvel article</button>
</WriterOnly>
```

### Hook d'authentification

```tsx
import { useAuth } from "@/lib/auth-context";

export function Header() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <nav>
      <span>Bonjour, {user?.full_name}</span>
      {isAdmin && <a href="/admin/dashboard">Administration</a>}
      <button onClick={logout}>Déconnexion</button>
    </nav>
  );
}
```

---

## Logique des rôles

| Action | Admin | Writer |
|--------|-------|--------|
| Écrire un article | ✅ | ✅ |
| Publier son article | ✅ | ✅ |
| Publier l'article d'un autre | ✅ | ❌ |
| Gérer les utilisateurs | ✅ | ❌ |
| Promouvoir/rétrograder | ✅ | ❌ |
| Voir le tableau de bord admin | ✅ | ❌ |