from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UserRole

User = get_user_model()
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from rest_framework import exceptions


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"]      = user.role
        token["email"]     = user.email
        token["full_name"] = user.get_full_name()
        token["is_admin"]  = user.role == UserRole.ADMIN
        return token

    def validate(self, attrs):
        email = attrs.get('email', '').lower().strip()
        password = attrs.get('password', '')
        
        # Vérifier si l'utilisateur existe
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed(
                'Aucun compte trouvé avec cet email.',
                code='no_active_account'
            )
        
        # Vérifier si le compte est actif
        if not user.is_active:
            raise exceptions.AuthenticationFailed(
                'Ce compte a été désactivé.',
                code='no_active_account'
            )
        
        # Vérifier le mot de passe
        if not user.check_password(password):
            raise exceptions.AuthenticationFailed(
                'Mot de passe incorrect.',
                code='no_active_account'
            )
        
        # Tout est bon → continuer
        data = super().validate(attrs)
        
        # Ajouter les infos utilisateur dans la réponse
        data['user'] = {
            'id': str(user.id),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
        }
        
        return data
class UserPublicSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "full_name",
            "bio",
            "avatar_url",
            "role",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_avatar_url(self, obj):
        request = self.context.get("request")

        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)

        return None


# ─────────────────────────────────────────────────────────
# Profil utilisateur connecté
# ─────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "bio",
            "avatar",
            "avatar_url",
            "role",
            "is_active",
            "date_joined",
        ]

        read_only_fields = [
            "id",
            "role",
            "is_active",
            "date_joined",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_avatar_url(self, obj):
        request = self.context.get("request")

        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)

        return None

    def validate_email(self, value):
        email = value.lower().strip()

        if User.objects.exclude(pk=self.instance.pk if self.instance else None).filter(email=email).exists():
            raise serializers.ValidationError(
                "Cette adresse email est déjà utilisée."
            )

        return email


# ─────────────────────────────────────────────────────────
# Création compte writer
# ─────────────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
    )

    password_confirm = serializers.CharField(
        write_only=True
    )

    class Meta:
        model = User

        fields = [
            "email",
            "first_name",
            "last_name",
            "password",
            "password_confirm",
        ]

    def validate_email(self, value):
        email = value.lower().strip()

        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError(
                "Un compte existe déjà avec cet email."
            )

        return email

    def validate(self, attrs):
        password = attrs.get("password")
        password_confirm = attrs.pop("password_confirm")

        if password != password_confirm:
            raise serializers.ValidationError({
                "password": "Les mots de passe ne correspondent pas."
            })

        return attrs

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data["email"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            password=validated_data["password"],
            role=UserRole.WRITER,
        )


# ─────────────────────────────────────────────────────────
# Gestion admin utilisateurs
# ─────────────────────────────────────────────────────────

class AdminUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=8,
        validators=[validate_password],
    )

    class Meta:
        model = User

        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "bio",
            "avatar",
            "avatar_url",
            "role",
            "is_active",
            "is_staff",
            "date_joined",
            "password",
        ]

        read_only_fields = [
            "id",
            "date_joined",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_avatar_url(self, obj):
        request = self.context.get("request")

        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)

        return None

    def validate_role(self, value):
        if value not in UserRole.values:
            raise serializers.ValidationError(
                "Rôle invalide."
            )

        return value

    def validate_email(self, value):
        email = value.lower().strip()

        if User.objects.exclude(pk=self.instance.pk if self.instance else None).filter(email=email).exists():
            raise serializers.ValidationError(
                "Cette adresse email est déjà utilisée."
            )

        return email

    def create(self, validated_data):
        """Crée un nouvel utilisateur avec password hashé"""
        password = validated_data.pop("password", None)
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user

    def update(self, instance, validated_data):
        """Met à jour un utilisateur existant"""
        password = validated_data.pop("password", None)
        
        # Hashe le password s'il est fourni
        if password:
            instance.set_password(password)
        
        # Met à jour les autres champs
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


# ─────────────────────────────────────────────────────────
# Changement mot de passe
# ─────────────────────────────────────────────────────────

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(
        write_only=True
    )

    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
    )

    new_password_confirm = serializers.CharField(
        write_only=True
    )

    def validate(self, attrs):
        new_password = attrs.get("new_password")
        new_password_confirm = attrs.pop("new_password_confirm")

        if new_password != new_password_confirm:
            raise serializers.ValidationError({
                "new_password": (
                    "Les nouveaux mots de passe "
                    "ne correspondent pas."
                )
            })

        return attrs