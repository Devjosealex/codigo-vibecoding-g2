from django.db import models


class Shipment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('assigned', 'Asignado'),
        ('in_transit', 'En tránsito'),
        ('delivered', 'Entregado'),
        ('cancelled', 'Cancelado'),
        ('returned', 'Devuelto'),
    ]

    tracking_number = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.PROTECT,
        related_name='shipments',
    )
    origin_warehouse = models.ForeignKey(
        'warehouses.Warehouse',
        on_delete=models.PROTECT,
        related_name='shipments',
    )
    vehicle = models.ForeignKey(
        'transport.Vehicle',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shipments',
    )
    route = models.ForeignKey(
        'routes.Route',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shipments',
    )
    destination_address = models.TextField()
    destination_city = models.CharField(max_length=100)
    destination_country = models.CharField(max_length=100, default='Peru')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    scheduled_date = models.DateField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    base_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    calculated_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shipments_shipment'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.tracking_number} — {self.status}"


class ShipmentItem(models.Model):
    shipment = models.ForeignKey(
        Shipment,
        on_delete=models.CASCADE,
        related_name='items',
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.PROTECT,
        related_name='shipment_items',
    )
    quantity = models.IntegerField()
    unit_price_at_shipment = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'shipments_shipmentitem'
        unique_together = [('shipment', 'product')]

    def __str__(self):
        return f"{self.product} × {self.quantity}"
