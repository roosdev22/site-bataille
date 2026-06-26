class ComplexityPasswordValidator:
    """
    Classe qui valide la complexité des mots de passe
    """
    
    def validate(self, password, user=None):
        """
        Méthode appelée par Django quand un utilisateur crée/modifie son mot de passe
        
        Args:
            password: Le mot de passe à vérifier
            user: L'utilisateur (optionnel)
        
        Raises:
            ValidationError: Si le mot de passe ne respecte pas les règles
        """
        # Votre code de validation ici
        pass
    
    def get_help_text(self):
        """
        Méthode qui retourne le texte d'aide affiché à l'utilisateur
        """
        return "Votre mot de passe doit contenir..."