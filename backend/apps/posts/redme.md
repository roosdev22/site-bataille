# Module Post — Blog Django + Next.js

Multi-catégorie : **Médical, Voyage, Technologie, Éducation, Lifestyle, Science, Juridique, Finance**.

---

## Structure

```
backend/posts/
  models.py       → Post, Tag, PostView, PostCategory, PostStatus
  serializers.py  → List / Detail / Write / Publish / Reject
  permissions.py  → IsPostAuthor, CanEditPost, CanSubmitPost, CanPublishPost
  views.py        → Public + Writer ViewSet + Admin ViewSet
  filters.py      → PostFilter (category, tag, status, date range)
  pagination.py   → PostPagination (12/page, max 50)
  urls.py         → Routes publiques + /writer/ + /admin/
  admin.py        → Interface Django Admin avec badges colorés

frontend/
  types/post.ts           → Types TypeScript complets
  lib/post-api.ts         → Clients postApi / writerApi / adminPostApi
  hooks/usePosts.ts       → Hooks useAsync, usePosts, useWriterPosts, usePostMutation
  components/PostForm.tsx → Formulaire complet (catégorie, tags, SEO, image)
```

---

## Installation Backend

```bash
pip install django-filter
```

### settings.py

```python
INSTALLED_APPS = [
    ...
    "rest_framework",
    "django_filters",
    "users",
    "posts",
]

REST_FRAMEWORK = {
    ...
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"],
    "DEFAULT_PAGINATION_CLASS": "posts.pagination.PostPagination",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
    },
}

MEDIA_URL  = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
```

### urls.py (projet)

```python
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include

urlpatterns = [
    path("api/", include("users.urls")),
    path("api/", include("posts.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

```bash
python manage.py makemigrations posts
python manage.py migrate
```

---

## Endpoints API

### Public (sans auth)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/posts/` | Articles publiés (filtrables) |
| GET | `/api/posts/<slug>/` | Détail + comptage de vue |
| GET | `/api/tags/` | Tous les tags |

**Filtres disponibles** : `?category=medical&tag=urgence&search=diabète&ordering=-views_count&page=2`

### Writer (authentifié)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/writer/posts/` | Mes articles |
| POST | `/api/writer/posts/` | Créer un article |
| GET | `/api/writer/posts/<id>/` | Détail |
| PATCH | `/api/writer/posts/<id>/` | Modifier (DRAFT/REJECTED seulement) |
| DELETE | `/api/writer/posts/<id>/` | Supprimer (DRAFT/REJECTED seulement) |
| POST | `/api/writer/posts/<id>/submit/` | Soumettre → PENDING |
| POST | `/api/writer/posts/<id>/retract/` | Retirer → DRAFT |

### Admin

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/admin/posts/` | Tous les articles |
| POST | `/api/admin/posts/<id>/publish/` | Publier |
| POST | `/api/admin/posts/<id>/reject/` | Rejeter (motif requis) |
| POST | `/api/admin/posts/<id>/archive/` | Archiver |

---

## Workflow des statuts

```
                     Writer                Admin
                       │                    │
              [Crée]   │                    │
           DRAFT ──────┤ submit()           │
                       │                    │
           PENDING ────┼────────────────────┤ publish()
                       │  retract()         │    │
                       │◄───────────────────┤ reject()
                       │                    │    │
           REJECTED    │                    │    │
           (éditable)  │                    │    ▼
                       │             PUBLISHED
                       │                    │
                       │                    │ archive()
                       │                    ▼
                       │              ARCHIVED
```

---

## Utilisation Frontend

```tsx
// Liste publique par catégorie médicale
const { data, loading } = usePosts({ category: "medical", page: 1 });

// Dashboard writer
const { data: myPosts } = useWriterPosts({ status: "draft" });

// Créer un article
const { mutate, loading, error } = usePostMutation(
  writerApi.create,
  (post) => router.push(`/writer/posts/${post.id}`)
);

await mutate({
  title: "Les bases du diabète de type 2",
  category: "medical",
  excerpt: "...",
  content: "...",
  tags: [1, 3],
});

// Soumettre pour relecture
const { mutate: submit } = usePostMutation(
  (id: string) => writerApi.submit(id),
  () => toast.success("Article soumis !")
);
```

---

## Sécurité

- **Isolation auteur** : un writer ne peut jamais voir ou modifier les articles d'un autre.
- **Statuts protégés** : seuls DRAFT et REJECTED sont modifiables par le writer.
- **Auteur injecté serveur** : le champ `author` n'est jamais accepté depuis le client.
- **Suppression protégée** : `on_delete=PROTECT` sur l'auteur, aucune cascade.
- **Compteur de vues** : dédupliqué par IP, incrémenté avec `F()` (pas de race condition).
- **Throttling** : 100 req/h pour les anonymes, 1000 req/h pour les utilisateurs connectés.
- **N+1 éliminé** : `select_related("author").prefetch_related("tags")` sur tous les QuerySets.