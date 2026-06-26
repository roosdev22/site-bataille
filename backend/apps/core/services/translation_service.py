import requests
from django.conf import settings

class LibreTranslateService:
    @staticmethod
    def translate(text, source_lang, target_lang):
        """Traduit du texte via l'API LibreTranslate publique"""
        url = settings.LIBRETRANSLATE_API_URL
        
        payload = {
            "q": text,
            "source": source_lang,
            "target": target_lang
        }
        
        try:
            response = requests.post(
                f"{url}/translate",
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            return data.get("translatedText", text)
        except Exception as e:
            print(f"Translation error: {e}")
            return text  