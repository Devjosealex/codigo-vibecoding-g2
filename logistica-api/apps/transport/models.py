from django.db import models


class Vehicle(models.Model):
    VEHICLE_TYPE_CHOICES = [
        ('truck', 'Camión'),
        ('van', 'Furgoneta'),
        ('motorcycle', 'Motocicleta'),
        ('other', 'Otro'),
    ]

    driver = models.ForeignKey(
        'drivers.Driver',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vehicles',
    )
    name = models.CharField(max_length=200)
    plate_number = models.CharField(max_length=20, unique=True)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPE_CHOICES)
    capacity_kg = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    capacity_m3 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transport_vehicle'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.plate_number})"
