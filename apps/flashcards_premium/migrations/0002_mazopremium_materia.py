# Generated migration for adding tema field to MazoPremium

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('temas', '0001_initial'),
        ('flashcards_premium', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='mazopremium',
            name='tema',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='mazos_premium', to='temas.tema', verbose_name='Tema'),
        ),
    ]
