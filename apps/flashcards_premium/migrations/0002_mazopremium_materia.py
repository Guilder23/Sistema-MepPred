# Generated migration for adding materia field to MazoPremium

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('materias', '0001_initial'),
        ('flashcards_premium', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='mazopremium',
            name='materia',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='mazos_premium', to='materias.materia', verbose_name='Materia'),
        ),
    ]
