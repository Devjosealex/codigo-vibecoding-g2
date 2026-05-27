from django.db import models


class Customer(models.Model):
    CUSTOMER_TYPE_CHOICES = [
        ('company', 'Empresa'),
        ('individual', 'Persona natural'),
    ]

    user = models.OneToOneField(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customer_profile',
    )
    name = models.CharField(max_length=200)
    customer_type = models.CharField(max_length=10, choices=CUSTOMER_TYPE_CHOICES)
    tax_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, default='Peru')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers_customer'
        ordering = ['-created_at']

    def __str__(self):
        return self.name
