"""
apps/core/routers.py
Router DRF avec slash final réellement optionnel.

DefaultRouter(trailing_slash='/?') ne fonctionne PAS comme on pourrait le
croire : DRF traite ce paramètre comme un booléen (`'/' if trailing_slash
else ''`), donc toute chaîne non vide est équivalente à True — le slash
reste obligatoire. Ce routeur contourne ça en assignant l'attribut
directement après l'initialisation.
"""
from rest_framework.routers import DefaultRouter


class OptionalSlashRouter(DefaultRouter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.trailing_slash = '/?'