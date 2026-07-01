# apps/ads/apps.py

from django.apps import AppConfig


class AdsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.ads'
    verbose_name = "Publicités"
    
    def ready(self):
        """
        Appelé au démarrage de Django.
        Enregistre les signaux pour l'upload automatique des images vers Supabase.
        """
        import apps.ads.signals  # noqa
        print("[AdsConfig] Signaux Supabase Storage chargés ✅")