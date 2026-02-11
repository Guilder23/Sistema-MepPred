# Generated migration for adding tema field to Mazo

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('temas', '0001_initial'),
        ('flashcards', '0003_remove_mazo_creado_por_admin_remove_mazo_es_premium'),
    ]

    operations = [
        migrations.AddField(
            model_name='mazo',
            name='tema',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='mazos_flashcards', to='temas.tema', verbose_name='Tema'),
        ),
    ]
