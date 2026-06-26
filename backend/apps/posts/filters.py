import django_filters
from .models import Post, PostCategory, PostStatus


class PostFilter(django_filters.FilterSet):
    category = django_filters.ChoiceFilter(choices=PostCategory.choices)
    status   = django_filters.ChoiceFilter(choices=PostStatus.choices)
    tag      = django_filters.CharFilter(field_name="tags__slug", lookup_expr="exact")
    author   = django_filters.NumberFilter(field_name="author__id")
    from_date = django_filters.DateTimeFilter(field_name="published_at", lookup_expr="gte")
    to_date   = django_filters.DateTimeFilter(field_name="published_at", lookup_expr="lte")

    class Meta:
        model  = Post
        fields = ["category", "status", "tag", "author", "from_date", "to_date"]