"""
Gestionnaire d'exceptions personnalisé pour l'API REST.
Objectifs :
- Ne jamais exposer d'informations sensibles dans les erreurs
- Logger toutes les erreurs de sécurité
- Retourner des messages clairs mais sécurisés
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging
import traceback

logger = logging.getLogger('django.security')


def custom_exception_handler(exc, context):
    """
    Intercepte toutes les exceptions de l'API REST.
    
    Args:
        exc: L'exception qui s'est produite
        context: Le contexte de la requête (vue, request, etc.)
    
    Returns:
        Response: La réponse d'erreur formatée
    """
    # D'abord, laisser DRF gérer l'exception normalement
    import sys
    print(f"=== EXCEPTION HANDLER: {type(exc).__name__} ===", file=sys.stderr, flush=True)
    import traceback
    traceback.print_exc(file=sys.stderr)
    response = exception_handler(exc, context)
    
    if response is not None:
        # Récupérer la requête si disponible
        request = context.get('request')
        
        # Logger l'erreur avec des informations de contexte
        user_info = 'Anonymous'
        if request and request.user.is_authenticated:
            user_info = f'User {request.user.id} ({request.user.email})'
        
        logger.error(
            f' Exception: {type(exc).__name__}\n'
            f'   Utilisateur: {user_info}\n'
            f'   URL: {request.path if request else "N/A"}\n'
            f'   Méthode: {request.method if request else "N/A"}\n'
            f'   Détail: {str(exc)[:200]}'  # Limiter la longueur
        )
        
        # Personnaliser la réponse selon le type d'erreur
        if response.status_code == 500:
            # Erreur interne : message générique (ne pas exposer les détails)
            response.data = {
                'error': 'Erreur interne du serveur',
                'detail': (
                    'Une erreur inattendue est survenue. '
                    'Notre équipe technique a été notifiée.'
                )
            }
        
        elif response.status_code == 403:
            # Accès interdit
            response.data = {
                'error': 'Accès refusé',
                'detail': (
                    'Vous n\'avez pas les permissions nécessaires '
                    'pour effectuer cette action.'
                )
            }
        
        elif response.status_code == 404:
            # Ressource non trouvée
            response.data = {
                'error': 'Non trouvé',
                'detail': 'La ressource demandée n\'existe pas ou a été supprimée.'
            }
        
        elif response.status_code == 405:
            # Méthode non autorisée
            response.data = {
                'error': 'Méthode non autorisée',
                'detail': f'La méthode {request.method} n\'est pas autorisée sur cette URL.'
            }
        
        # En production, nettoyer les messages d'erreur sensibles
        from django.conf import settings
        if not settings.DEBUG:
            # Masquer les détails techniques
            if 'detail' in response.data:
                detail = str(response.data['detail']).lower()
                
                # Si le message contient des infos sensibles, le remplacer
                if any(word in detail for word in [
                    'password', 'credential', 'token', 'secret', 'key'
                ]):
                    response.data['detail'] = (
                        'Une erreur de sécurité est survenue. '
                        'Veuillez réessayer.'
                    )
    
    else:
        # Si DRF n'a pas géré l'exception, c'est une erreur inattendue
        logger.critical(
            f' Exception non gérée: {type(exc).__name__}\n'
            f'   Traceback: {traceback.format_exc()}'
        )
        
        response = Response(
            {
                'error': 'Erreur inattendue',
                'detail': 'Une erreur technique est survenue. L\'équipe a été notifiée.'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return response