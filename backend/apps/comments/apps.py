from django.apps import AppConfig


class CommentsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.comments"
    verbose_name = "Commentaires"

    def ready(self):
        import apps.comments.signals  # noqa