"""
Middleware de sécurité pour l'application Django.
Protège contre :
- XSS (Cross-Site Scripting)
- Clickjacking
- MIME sniffing
- DDoS basique (rate limiting)
"""
from django.utils.deprecation import MiddlewareMixin
from django.http import HttpResponse
from django.core.cache import cache
import logging

logger = logging.getLogger('django.security')


class SecurityHeadersMiddleware:
    """
    Ajoute les headers de sécurité essentiels à chaque réponse HTTP.
    Ces headers disent au navigateur comment se comporter pour protéger l'utilisateur.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        response = self.get_response(request)
        
        # Empêche le navigateur de deviner le type MIME
        # Protège contre les attaques où un fichier malveillant se fait passer pour autre chose
        response['X-Content-Type-Options'] = 'nosniff'
        
        # Empêche votre site d'être affiché dans une iframe
        # Protège contre le clickjacking (un site malveillant qui superpose des boutons invisibles)
        response['X-Frame-Options'] = 'DENY'
        
        # Active le filtre XSS intégré des navigateurs
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Contrôle quelles informations sont envoyées dans le header Referer
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Content Security Policy : dit au navigateur quelles ressources peuvent être chargées
        response['Content-Security-Policy'] = (
            "default-src 'self'; "                    # Par défaut, tout vient de votre site
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "  # Scripts : votre site seulement
            "style-src 'self' 'unsafe-inline'; "      # Styles : votre site seulement
            "img-src 'self' data: https: blob:; "     # Images : votre site + données + https
            "font-src 'self'; "                       # Polices : votre site seulement
            "connect-src 'self' http://localhost:3000; "  # Connexions API autorisées
            "frame-ancestors 'none'; "                # Interdit l'inclusion dans des iframes
            "base-uri 'self'; "                       # Base URL : votre site seulement
            "form-action 'self';"                     # Formulaires : votre site seulement
        )
        
        # Permissions Policy : désactive les fonctionnalités non utilisées
        response['Permissions-Policy'] = (
            'camera=(), '         # Pas d'accès à la caméra
            'microphone=(), '     # Pas d'accès au micro
            'geolocation=(), '    # Pas de géolocalisation
            'interest-cohort=()'  # Protection contre FLoC (Google)
        )
        
        # Empêche la mise en cache des pages admin (données sensibles)
        if request.path.startswith('/api/admin/'):
            response['Cache-Control'] = 'no-store, no-cache, must-revalidate'
            response['Pragma'] = 'no-cache'
        
        return response


class RateLimitMiddleware:
    """
    Protection basique contre les attaques DDoS et le brute force.
    Limite le nombre de requêtes par IP.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # Ne pas limiter les fichiers statiques et médias
        if request.path.startswith('/static/') or request.path.startswith('/media/'):
            return self.get_response(request)
        
        # Récupérer l'adresse IP du client
        client_ip = self._get_client_ip(request)
        
        # Clé unique pour cette IP dans le cache
        cache_key = f'rate_limit_{client_ip}'
        
        # Combien de requêtes cette IP a-t-elle faites dans la dernière minute ?
        request_count = cache.get(cache_key, 0)
        
        # Définir les limites selon le type d'utilisateur
        if request.user.is_authenticated:
            limit = 200  # Utilisateurs connectés : 200 requêtes/minute
        else:
            limit = 60   # Visiteurs anonymes : 60 requêtes/minute
        
        # Vérifier si la limite est dépassée
        if request_count >= limit:
            logger.warning(f'Rate limit dépassé pour IP {client_ip} ({request_count} requêtes)')
            return HttpResponse(
                'Trop de requêtes. Veuillez réessayer dans une minute.',
                status=429  # HTTP 429 Too Many Requests
            )
        
        # Incrémenter le compteur (expire après 60 secondes)
        cache.set(cache_key, request_count + 1, 60)
        
        return self.get_response(request)
    
    def _get_client_ip(self, request):
        """
        Récupère la vraie adresse IP du client.
        Gère les proxys et load balancers.
        """
        # Si derrière un proxy, prendre l'IP originale
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            # Prendre la première IP de la liste
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            # Sinon, prendre l'IP directe
            ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
        
        return ip