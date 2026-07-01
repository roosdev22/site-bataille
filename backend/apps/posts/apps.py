# apps/posts/apps.py

from django.apps import AppConfig


class PostsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.posts'
    verbose_name = "Articles"
    
    def ready(self):
        """
        Appelé au démarrage de Django.
        Enregistre les signaux pour l'upload automatique des images vers Supabase.
        """
        import apps.posts.signals  # noqa
        print("[PostsConfig] Signaux Supabase Storage chargés ")