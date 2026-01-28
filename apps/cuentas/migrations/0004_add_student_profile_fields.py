# Generated migration for student profile fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cuentas', '0003_alter_user_managers'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='student_status',
            field=models.CharField(
                blank=True,
                choices=[('aspirant', 'Postulante'), ('university', 'Universitario')],
                default='aspirant',
                max_length=20,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='university',
            field=models.CharField(
                blank=True,
                help_text='Universidad donde estudias',
                max_length=255,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='faculty',
            field=models.CharField(
                blank=True,
                help_text='Facultad',
                max_length=255,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='career',
            field=models.CharField(
                blank=True,
                help_text='Carrera',
                max_length=255,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='birth_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='gender',
            field=models.CharField(
                blank=True,
                choices=[('male', 'Masculino'), ('female', 'Femenino'), ('other', 'Otro'), ('prefer_not', 'Prefiero no decirlo')],
                max_length=20,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='identity_number',
            field=models.CharField(
                blank=True,
                help_text='Número de cédula o carnet de identidad',
                max_length=50,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='nationality',
            field=models.CharField(
                blank=True,
                max_length=100,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='phone_number',
            field=models.CharField(
                blank=True,
                max_length=20,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name='user',
            name='study_year',
            field=models.CharField(
                blank=True,
                choices=[('pre_uni', 'Pre-universitario'), ('year_1', 'Año 1'), ('year_2', 'Año 2'), ('year_3', 'Año 3'), ('year_4', 'Año 4'), ('year_5', 'Año 5')],
                default='pre_uni',
                max_length=20,
                null=True,
            ),
        ),
    ]
