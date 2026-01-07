from django.apps import AppConfig


class LeaderboardConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.ranking'
    
    def ready(self):
        import apps.ranking.signals  # noqa
