# Generated migration for Tema

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('materias_nueva', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Tema',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=200, verbose_name='Nombre')),
                ('requiere_suscripcion', models.BooleanField(default=False, verbose_name='Requiere Suscripción')),
                ('materia', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='temas', to='materias_nueva.materia', verbose_name='Materia')),
            ],
            options={
                'verbose_name': 'Tema',
                'verbose_name_plural': 'Temas',
            },
        ),
    ]
