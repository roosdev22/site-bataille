from rest_framework import serializers

from .models import Comment, CommentStatus


# ─────────────────────────────────────────────
# Auteur minimal (évite d'exposer l'email)
# ─────────────────────────────────────────────

class CommentAuthorSerializer(serializers.Serializer):
    id        = serializers.IntegerField()
    full_name = serializers.SerializerMethodField()
    avatar    = serializers.ImageField()
    role      = serializers.CharField()

    def get_full_name(self, obj):
        return obj.get_full_name() if obj else "Utilisateur supprimé"


# ─────────────────────────────────────────────
# Réponse (reply) — sans sous-réponses (1 niveau max)
# ─────────────────────────────────────────────

class ReplySerializer(serializers.ModelSerializer):
    author     = CommentAuthorSerializer(read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    liked_by_me = serializers.SerializerMethodField()

    class Meta:
        model  = Comment
        fields = [
            "id", "body", "author",
            "likes_count", "liked_by_me",
            "status", "created_at", "updated_at",
        ]

    def get_liked_by_me(self, obj) -> bool:
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.likes.filter(user=request.user).exists()


# ─────────────────────────────────────────────
# Commentaire racine (avec ses réponses)
# ─────────────────────────────────────────────

class CommentSerializer(serializers.ModelSerializer):
    author      = CommentAuthorSerializer(read_only=True)
    replies     = ReplySerializer(many=True, read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    liked_by_me = serializers.SerializerMethodField()

    class Meta:
        model  = Comment
        fields = [
            "id", "body", "author",
            "likes_count", "liked_by_me", "replies_count",
            "replies", "status",
            "created_at", "updated_at",
        ]

    def get_liked_by_me(self, obj) -> bool:
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.likes.filter(user=request.user).exists()


# ─────────────────────────────────────────────
# Écriture (create)
# ─────────────────────────────────────────────

class CommentCreateSerializer(serializers.ModelSerializer):
    """
    Utilisé pour créer un commentaire ou une réponse.
    `post` et `author` sont injectés par la vue.
    `parent` est validé : doit appartenir au même post et être racine.
    """
    parent = serializers.PrimaryKeyRelatedField(
        queryset=Comment.objects.approved(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model  = Comment
        fields = ["body", "parent"]

    def validate_parent(self, parent):
        if parent is None:
            return None
        # Empêche les réponses imbriquées (reply d'une reply)
        if parent.parent_id is not None:
            raise serializers.ValidationError(
                "Impossible de répondre à une réponse. Répondez au commentaire principal."
            )
        # Vérifie que le parent appartient au même post
        post = self.context.get("post")
        if post and parent.post_id != post.id:
            raise serializers.ValidationError(
                "Le commentaire parent n'appartient pas à cet article."
            )
        return parent

    def validate_body(self, value: str) -> str:
        # Trim basique anti-spam (espaces, répétitions)
        stripped = value.strip()
        if len(stripped) < 2:
            raise serializers.ValidationError("Le commentaire est trop court.")
        return stripped


# ─────────────────────────────────────────────
# Modification (edit)
# ─────────────────────────────────────────────

class CommentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Comment
        fields = ["body"]

    def validate_body(self, value: str) -> str:
        return value.strip()


# ─────────────────────────────────────────────
# Actions admin
# ─────────────────────────────────────────────

class CommentRejectSerializer(serializers.Serializer):
    rejection_note = serializers.CharField(max_length=300, required=False, allow_blank=True)


# ─────────────────────────────────────────────
# Admin — liste complète (inclut tous les statuts)
# ─────────────────────────────────────────────

class AdminCommentSerializer(serializers.ModelSerializer):
    author      = CommentAuthorSerializer(read_only=True)
    post_title  = serializers.CharField(source="post.title", read_only=True)
    post_slug   = serializers.CharField(source="post.slug",  read_only=True)

    class Meta:
        model  = Comment
        fields = [
            "id", "body", "author",
            "post_title", "post_slug",
            "status", "rejection_note",
            "likes_count", "replies_count",
            "parent",
            "created_at", "updated_at", "deleted_at",
        ]