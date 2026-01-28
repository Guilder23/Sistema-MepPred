# Generated migration for adding materia field to Mazo

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('materias', '0001_initial'),
        ('flashcards', '0003_remove_mazo_creado_por_admin_remove_mazo_es_premium'),
    ]

    operations = [
        migrations.AddField(
            model_name='mazo',
            name='materia',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='mazos_flashcards', to='materias.materia', verbose_name='Materia'),
        ),
    ]
