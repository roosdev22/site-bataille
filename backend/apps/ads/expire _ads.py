"""
Commande de maintenance à planifier via cron ou Celery Beat.

    python manage.py expire_ads

Cron (tous les jours à minuit) :
    0 0 * * * /path/to/venv/bin/python manage.py expire_ads
"""
from django.core.management.base import BaseCommand
from django.utils import timezone

from ads.models import Ad, AdStatus


class Command(BaseCommand):
    help = "Passe automatiquement les publicités expirées en statut EXPIRED."

    def handle(self, *args, **options):
        now = timezone.now()

        # 1. Expirées par date
        expired_by_date = Ad.objects.filter(
            status=AdStatus.ACTIVE,
            end_date__lt=now,
        )
        count_date = expired_by_date.update(status=AdStatus.EXPIRED)

        # 2. Expirées par budget impressions
        from django.db.models import F
        expired_by_imp = Ad.objects.filter(
            status=AdStatus.ACTIVE,
            max_impressions__isnull=False,
            impressions_count__gte=F("max_impressions"),
        )
        count_imp = expired_by_imp.update(status=AdStatus.EXPIRED)

        # 3. Expirées par budget clics
        expired_by_clk = Ad.objects.filter(
            status=AdStatus.ACTIVE,
            max_clicks__isnull=False,
            clicks_count__gte=F("max_clicks"),
        )
        count_clk = expired_by_clk.update(status=AdStatus.EXPIRED)

        total = count_date + count_imp + count_clk
        self.stdout.write(
            self.style.SUCCESS(
                f"{total} pub(s) expirée(s) "
                f"(date: {count_date}, impressions: {count_imp}, clics: {count_clk})"
            )
        )