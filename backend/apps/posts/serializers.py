# posts/serializers.py
from rest_framework import serializers
from django.utils import timezone
from PIL import Image

from .models import Post, PostStatus, PostLanguage, Tag
from apps.users.serializers import UserPublicSerializer


# ─────────────────────────────────────────────
# Tag
# ─────────────────────────────────────────────

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug"]
        read_only_fields = ["slug"]


# ─────────────────────────────────────────────
# Post — List (Léger + Multilingue)
# ─────────────────────────────────────────────

class PostListSerializer(serializers.ModelSerializer):
    """Serializer pour la liste des articles avec traduction automatique"""
    
    author = UserPublicSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    source_language = serializers.CharField(read_only=True)
    cover_image = serializers.ImageField(read_only=True)

    class Meta:
        model = Post
        fields = [
            "id", "title", "slug", "excerpt", "cover_image",
            "category", "category_display",
            "tags", "author",
            "status", "status_display",
            "views_count", "published_at", "created_at",
            "source_language"
        ]

    def to_representation(self, instance):
        """
        ✨ Retourne SEULEMENT la langue demandée
        GET /api/posts/?language=en → affiche title_en, excerpt_en
        """
        data = super().to_representation(instance)
        requested_language = self.context.get('language', instance.source_language)
        
        # Récupère les versions traduites depuis la DB
        data['title'] = getattr(instance, f'title_{requested_language}') or data['title']
        data['excerpt'] = getattr(instance, f'excerpt_{requested_language}') or data['excerpt']
        
        return data


# ─────────────────────────────────────────────
# Post — Detail (Lecture + Multilingue)
# ─────────────────────────────────────────────

class PostDetailSerializer(serializers.ModelSerializer):
    """Serializer pour le détail d'un article avec traductions complètes"""
    
    author = UserPublicSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    source_language = serializers.CharField(read_only=True)
    cover_image = serializers.ImageField(read_only=True)

    class Meta:
        model = Post
        fields = [
            "id", "title", "slug", "excerpt", "content",
            "category", "category_display",
            "tags", "author", "cover_image",
            "status", "status_display",
            "meta_title", "meta_description",
            "created_at", "updated_at", "published_at",
            "views_count", "source_language"
        ]
        read_only_fields = [
            "id", "slug", "views_count", "created_at", "updated_at", "published_at"
        ]

    def to_representation(self, instance):
        """
        ✨ Retourne SEULEMENT la langue demandée + contenu complet
        """
        data = super().to_representation(instance)
        requested_language = self.context.get('language', instance.source_language)
        
        # Récupère TOUTES les versions traduites
        data['title'] = getattr(instance, f'title_{requested_language}') or data['title']
        data['excerpt'] = getattr(instance, f'excerpt_{requested_language}') or data['excerpt']
        data['content'] = getattr(instance, f'content_{requested_language}') or data['content']
        data['meta_title'] = getattr(instance, f'meta_title_{requested_language}') or data['meta_title']
        data['meta_description'] = getattr(instance, f'meta_description_{requested_language}') or data['meta_description']
        
        return data


# ─────────────────────────────────────────────
# Post — Write (Création/Modification)
# ─────────────────────────────────────────────

class PostWriteSerializer(serializers.ModelSerializer):
    """
    Serializer pour CREATE et UPDATE d'articles
    - Support multilingue via source_language
    - Validation avancée des images
    - Validation du contenu
    """
    
    tags = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        required=False
    )
    
    source_language = serializers.ChoiceField(
        choices=PostLanguage.choices,
        default=PostLanguage.FR,
        help_text="Langue dans laquelle vous écrivez cet article"
    )
    
    # Cover image obligatoire
    cover_image = serializers.ImageField(
        required=True,
        error_messages={
            'required': 'L\'image de couverture est obligatoire.',
            'invalid': 'Le fichier fourni n\'est pas une image valide.',
            'empty': 'Aucun fichier n\'a été soumis.',
        }
    )

    class Meta:
        model = Post
        fields = [
            "title", "excerpt", "content",
            "category", "tags",
            "cover_image",
            "meta_title", "meta_description",
            "source_language"
        ]

    def validate_cover_image(self, value):
        """
        Validation complète de l'image de couverture:
        - Taille max 5MB
        - Formats autorisés: JPEG, PNG, WebP
        - Dimensions min: 800×400px
        """
        # Vérifier la taille (5MB max)
        max_size = 5 * 1024 * 1024  # 5MB en bytes
        if value.size > max_size:
            raise serializers.ValidationError(
                f"L'image ne doit pas dépasser {max_size // (1024*1024)}MB. "
                f"Taille actuelle : {value.size // (1024*1024)}MB"
            )
        
        # Vérifier le type MIME
        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        if hasattr(value, 'content_type'):
            if value.content_type not in allowed_types:
                raise serializers.ValidationError(
                    f"Format non supporté. Utilisez : {', '.join(allowed_types)}"
                )
        
        # Vérifier les dimensions minimales
        try:
            img = Image.open(value)
            width, height = img.size
            if width < 800 or height < 400:
                raise serializers.ValidationError(
                    f"L'image doit faire au moins 800×400px. "
                    f"Dimensions actuelles : {width}×{height}px"
                )
        except Exception as e:
            if 'L\'image doit faire' in str(e):
                raise
            # Si erreur d'ouverture, laisser passer (PIL va valider)
            pass
        
        return value

    def validate_title(self, value):
        """Valide le titre"""
        if len(value) < 10:
            raise serializers.ValidationError(
                "Le titre doit contenir au moins 10 caractères."
            )
        return value

    def validate_excerpt(self, value):
        """Valide le résumé"""
        if len(value) < 30:
            raise serializers.ValidationError(
                "Le résumé doit contenir au moins 30 caractères."
            )
        return value

    def validate_content(self, value):
        """Valide le contenu"""
        word_count = len(value.split())
        if word_count < 50:
            raise serializers.ValidationError(
                f"Le contenu doit contenir au moins 50 mots. "
                f"Mots actuels : {word_count}"
            )
        return value

    def validate(self, attrs):
        """Validation globale"""
        # Vérifier que source_language est valide
        source_lang = attrs.get('source_language')
        if source_lang not in [lang[0] for lang in PostLanguage.choices]:
            raise serializers.ValidationError(
                {"source_language": "Langue source non supportée."}
            )
        
        # Pour création: cover_image obligatoire
        if self.instance is None:
            if not attrs.get('cover_image'):
                raise serializers.ValidationError(
                    {"cover_image": "L'image de couverture est obligatoire."}
                )
        
        return attrs

    def create(self, validated_data):
        """Crée l'article et associe les tags"""
        tags = validated_data.pop("tags", [])
        post = Post.objects.create(**validated_data)
        post.tags.set(tags)
        return post

    def update(self, instance, validated_data):
        """Modifie l'article"""
        # Vérifier que l'article peut être édité
        if not instance.can_be_edited:
            raise serializers.ValidationError(
                "Seuls les brouillons et articles rejetés peuvent être modifiés."
            )
        
        tags = validated_data.pop("tags", None)
        
        # Mettre à jour les champs
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Mettre à jour les tags si fournis
        if tags is not None:
            instance.tags.set(tags)
        
        return instance


# ─────────────────────────────────────────────
# Post — Actions Admin
# ─────────────────────────────────────────────

class PostPublishSerializer(serializers.Serializer):
    """
    Serializer pour publier ou reprogrammer un article
    POST /api/posts/{id}/publish/
    """
    published_at = serializers.DateTimeField(
        required=False,
        allow_null=True,
        help_text="Date de publication (optionnel, défaut: maintenant)"
    )

    def validate_published_at(self, value):
        """Vérifie que la date n'est pas dans le passé"""
        if value and value < timezone.now():
            raise serializers.ValidationError(
                "La date de publication ne peut pas être dans le passé."
            )
        return value


class PostRejectSerializer(serializers.Serializer):
    """
    Serializer pour rejeter un article
    POST /api/posts/{id}/reject/
    """
    rejection_note = serializers.CharField(
        min_length=10,
        max_length=500,
        help_text="Motif du rejet (obligatoire)"
    )