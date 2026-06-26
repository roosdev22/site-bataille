from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "get_full_name", "role", "is_active", "date_joined"]
    list_filter = ["role", "is_active", "is_staff"]
    search_fields = ["email", "first_name", "last_name"]
    ordering = ["-date_joined"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (_("Informations personnelles"), {"fields": ("first_name", "last_name", "bio", "avatar")}),
        (_("Rôle et permissions"), {"fields": ("role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        (_("Dates"), {"fields": ("date_joined", "last_login")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "first_name", "last_name", "role", "password1", "password2"),
        }),
    )
    readonly_fields = ["date_joined", "last_login"]

    actions = ["activate_users", "deactivate_users", "make_admin", "make_writer"]

    @admin.action(description="Activer les comptes sélectionnés")
    def activate_users(self, request, queryset):
        queryset.update(is_active=True)

    @admin.action(description="Désactiver les comptes sélectionnés")
    def deactivate_users(self, request, queryset):
        queryset.exclude(pk=request.user.pk).update(is_active=False)

    @admin.action(description="Promouvoir en Administrateur")
    def make_admin(self, request, queryset):
        queryset.update(role="admin", is_staff=True)

    @admin.action(description="Rétrograder en Écrivain")
    def make_writer(self, request, queryset):
        queryset.exclude(pk=request.user.pk).update(role="writer", is_staff=False)