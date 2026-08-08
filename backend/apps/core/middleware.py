"""
Middleware de sécurité pour l'application Django.
Protège contre :
- XSS (Cross-Site Scripting)
- Clickjacking
- MIME sniffing
- DDoS basique (rate limiting)
"""
from django.http import HttpResponse
from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger('django.security')


class SecurityHeadersMiddleware:
    """
    Ajoute les headers de sécurité essentiels à chaque réponse HTTP.
    Ces headers disent au navigateur comment se comporter pour protéger l'utilisateur.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        # Construit la liste des origines autorisées une seule fois au démarrage
        self.frontend_origins = " ".join(
            getattr(settings, 'CORS_ALLOWED_ORIGINS', ['http://localhost:3000'])
        )
        
    def __call__(self, request):
        response = self.get_response(request)
        
        # Empêche le navigateur de deviner le type MIME
        response['X-Content-Type-Options'] = 'nosniff'
        
        # Empêche votre site d'être affiché dans une iframe
        response['X-Frame-Options'] = 'DENY'
        
        # CORRIGÉ : '1; mode=block' est déprécié et peut créer des vulnérabilités
        # La protection XSS moderne passe uniquement par le CSP
        response['X-XSS-Protection'] = '0'
        
        # Contrôle quelles informations sont envoyées dans le header Referer
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Content Security Policy — dynamique via CORS_ALLOWED_ORIGINS
        response['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https: blob:; "
            "font-src 'self' data:; "
            f"connect-src 'self' {self.frontend_origins}; "  # CORRIGÉ : dynamique
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self';"
        )
        
        # Permissions Policy : désactive les fonctionnalités non utilisées
        response['Permissions-Policy'] = (
            'camera=(), '
            'microphone=(), '
            'geolocation=(), '
            'interest-cohort=()'
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
        
        client_ip = self._get_client_ip(request)
        cache_key = f'rate_limit_{client_ip}'
        request_count = cache.get(cache_key, 0)
        
        # Limites selon le type d'utilisateur
        if request.user.is_authenticated:
            limit = 200  # Utilisateurs connectés : 200 requêtes/minute
        else:
            limit = 60   # Visiteurs anonymes : 60 requêtes/minute
        
        if request_count >= limit:
            logger.warning(
                f'Rate limit dépassé pour IP {client_ip} ({request_count} requêtes)'
            )
            return HttpResponse(
                'Trop de requêtes. Veuillez réessayer dans une minute.',
                status=429
            )
        
        cache.set(cache_key, request_count + 1, 60)
        
        return self.get_response(request)
    
    def _get_client_ip(self, request):
        """
        Récupère la vraie adresse IP du client.
        Gère les proxys et load balancers (Render utilise des proxys).
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
        
        return ip