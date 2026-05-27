from decimal import Decimal
from django.utils import timezone
from rest_framework.exceptions import ValidationError


VALID_TRANSITIONS = {
    'pending': ['assigned', 'cancelled'],
    'assigned': ['in_transit', 'cancelled'],
    'in_transit': ['delivered', 'returned'],
    'delivered': ['returned'],
    'cancelled': [],
    'returned': [],
}

COST_PER_KG = Decimal('5.00')
COST_PER_KM = Decimal('0.50')


def generate_tracking_number() -> str:
    from .models import Shipment

    year = timezone.now().year
    count = Shipment.objects.filter(created_at__year=year).count()
    return f"LOG-{year}-{count + 1:05d}"


def calculate_shipment_cost(shipment) -> Decimal:
    total_weight = sum(
        item.quantity * item.product.weight_kg
        for item in shipment.items.select_related('product').all()
    )
    weight_cost = Decimal(str(total_weight)) * COST_PER_KG

    distance_cost = Decimal('0.00')
    if shipment.route and shipment.route.distance_km:
        distance_cost = shipment.route.distance_km * COST_PER_KM

    return weight_cost + distance_cost


def transition_status(shipment, new_status: str) -> None:
    current = shipment.status
    allowed = VALID_TRANSITIONS.get(current, [])

    if new_status not in allowed:
        raise ValidationError(
            f"Transición inválida: '{current}' → '{new_status}'. "
            f"Transiciones permitidas desde '{current}': {allowed or 'ninguna'}."
        )

    if new_status == 'delivered':
        shipment.delivered_at = timezone.now()

    shipment.status = new_status
    shipment.save()
