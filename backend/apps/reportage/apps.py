from django.apps import AppConfig


class ReportageConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.reportage'
    verbose_name = 'Module Reportage'
    
    def ready(self):
        """
        Appelé au démarrage de Django.
        Enregistre les signaux pour l'upload automatique des images vers Supabase.
        """
        import apps.reportage.signals  # noqa
        print("[ReportageConfig] Signaux Supabase Storage chargés ✅")