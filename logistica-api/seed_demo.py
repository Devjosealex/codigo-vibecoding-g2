"""
Demo data seed script for logistica-api.
Usage: python seed_demo.py
Requires backend running at http://localhost:8000
Credentials: jose@gmail.com / 123456
"""

import requests
import random
from datetime import date, datetime, timedelta
import json

BASE = "http://localhost:8000"
HEADERS = {}

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

def get_token():
    r = requests.post(f"{BASE}/api/auth/token/", json={"username": "jose@gmail.com", "password": "123456"})
    r.raise_for_status()
    token = r.json()["access"]
    HEADERS["Authorization"] = f"Bearer {token}"
    print("✓ Authenticated")

API = f"{BASE}/api/v1"

def post(path, data):
    r = requests.post(f"{API}{path}", json=data, headers=HEADERS)
    if not r.ok:
        print(f"  WARN {path}: {r.status_code} {r.text[:120]}")
        return None
    return r.json()

def get_list(path):
    r = requests.get(f"{API}{path}?limit=200", headers=HEADERS)
    r.raise_for_status()
    data = r.json()
    results = data.get("results", data) if isinstance(data, dict) else data
    return results

# ---------------------------------------------------------------------------
# Data helpers
# ---------------------------------------------------------------------------

def past_date(days_ago):
    return (date.today() - timedelta(days=days_ago)).isoformat()

def rand_decimal(lo, hi, decimals=2):
    return round(random.uniform(lo, hi), decimals)

# ---------------------------------------------------------------------------
# Suppliers
# ---------------------------------------------------------------------------

SUPPLIERS = [
    {"name": "Distribuidora Lima S.A.C.", "contact_name": "Carlos Mendoza", "email": "ventas@distrilima.pe", "phone": "01-4521890", "city": "Lima", "country": "Peru"},
    {"name": "Proveedores Andinos E.I.R.L.", "contact_name": "Ana Quispe", "email": "ana@provandinos.pe", "phone": "01-3456789", "city": "Lima", "country": "Peru"},
    {"name": "Importaciones Pacific S.A.", "contact_name": "Roberto Silva", "email": "rsilva@impacific.pe", "phone": "044-231456", "city": "Trujillo", "country": "Peru"},
    {"name": "Tech Supplies Perú", "contact_name": "María García", "email": "mgarcia@techsupplies.pe", "phone": "01-7890123", "city": "Lima", "country": "Peru"},
    {"name": "Agro Export Norte S.A.C.", "contact_name": "Juan Torres", "email": "jtorres@agroexportnorte.pe", "phone": "073-445678", "city": "Piura", "country": "Peru"},
    {"name": "Ferretería Industrial del Sur", "contact_name": "Pedro Vargas", "email": "pvargas@ferindusur.pe", "phone": "054-312890", "city": "Arequipa", "country": "Peru"},
]

# ---------------------------------------------------------------------------
# Warehouses
# ---------------------------------------------------------------------------

WAREHOUSES = [
    {"name": "Almacén Central Lima", "address": "Av. Universitaria 1250", "city": "Lima", "country": "Peru", "latitude": "-12.046374", "longitude": "-77.042793", "capacity_m3": "5000.00"},
    {"name": "Almacén Norte - Trujillo", "address": "Av. Industrial 450", "city": "Trujillo", "country": "Peru", "latitude": "-8.109052", "longitude": "-79.021518", "capacity_m3": "2500.00"},
    {"name": "Almacén Sur - Arequipa", "address": "Parque Industrial Lote 23", "city": "Arequipa", "country": "Peru", "latitude": "-16.409047", "longitude": "-71.537451", "capacity_m3": "3200.00"},
    {"name": "Centro Distribución Callao", "address": "Av. Néstor Gambetta 3800", "city": "Callao", "country": "Peru", "latitude": "-12.050450", "longitude": "-77.144019", "capacity_m3": "8000.00"},
]

# ---------------------------------------------------------------------------
# Customers
# ---------------------------------------------------------------------------

CUSTOMERS = [
    {"name": "Supermercados Metro S.A.", "customer_type": "company", "email": "logistica@metro.pe", "phone": "01-6150000", "city": "Lima", "country": "Peru"},
    {"name": "Plaza Vea Retail", "customer_type": "company", "email": "compras@plazavea.pe", "phone": "01-6251000", "city": "Lima", "country": "Peru"},
    {"name": "Farmacia InkaFarma", "customer_type": "company", "email": "abastecimiento@inkafarma.pe", "phone": "01-5124000", "city": "Lima", "country": "Peru"},
    {"name": "Sodimac Homecenter", "customer_type": "company", "email": "proveedores@sodimac.pe", "phone": "01-6120100", "city": "Lima", "country": "Peru"},
    {"name": "Restaurantes Bembos S.A.C.", "customer_type": "company", "email": "logistica@bembos.pe", "phone": "01-4445678", "city": "Lima", "country": "Peru"},
    {"name": "Clínica San Pablo", "customer_type": "company", "email": "compras@sanpablo.pe", "phone": "01-7130000", "city": "Lima", "country": "Peru"},
    {"name": "Universidad César Vallejo", "customer_type": "company", "email": "adquisiciones@ucv.edu.pe", "phone": "044-485000", "city": "Trujillo", "country": "Peru"},
    {"name": "Gobierno Regional La Libertad", "customer_type": "company", "email": "logistica@regionlalibertad.gob.pe", "phone": "044-234567", "city": "Trujillo", "country": "Peru"},
    {"name": "Constructora Graña y Montero", "customer_type": "company", "email": "suministros@gym.pe", "phone": "01-6130000", "city": "Lima", "country": "Peru"},
    {"name": "Miraflores Distribuciones", "customer_type": "company", "email": "miraflores.dist@gmail.com", "phone": "01-4456789", "city": "Lima", "country": "Peru"},
    {"name": "Transportes Rápido S.R.L.", "customer_type": "company", "email": "contacto@transportesrapido.pe", "phone": "01-3344556", "city": "Lima", "country": "Peru"},
    {"name": "Carlos Mamani Quispe", "customer_type": "individual", "email": "cmamani@gmail.com", "phone": "987654321", "city": "Arequipa", "country": "Peru"},
    {"name": "Ana Lucía Fernández", "customer_type": "individual", "email": "alucia.fernandez@hotmail.com", "phone": "976543210", "city": "Lima", "country": "Peru"},
    {"name": "Comercial El Progreso E.I.R.L.", "customer_type": "company", "email": "elprogreso@comercial.pe", "phone": "073-334455", "city": "Piura", "country": "Peru"},
    {"name": "Hotel Libertador Arequipa", "customer_type": "company", "email": "compras@libertador.pe", "phone": "054-215110", "city": "Arequipa", "country": "Peru"},
]

# ---------------------------------------------------------------------------
# Drivers
# ---------------------------------------------------------------------------

DRIVERS = [
    {"first_name": "Miguel", "last_name": "Ramos Torres", "document_number": "10234567", "license_number": "Q12345678", "license_expiry": past_date(-180), "phone": "999111222", "email": "mramos@logistica.pe"},
    {"first_name": "Jorge", "last_name": "Quispe Mamani", "document_number": "20345678", "license_number": "Q23456789", "license_expiry": past_date(-90), "phone": "999222333", "email": "jquispe@logistica.pe"},
    {"first_name": "Pedro", "last_name": "Flores García", "document_number": "30456789", "license_number": "Q34567890", "license_expiry": past_date(-60), "phone": "999333444", "email": "pflores@logistica.pe"},
    {"first_name": "Luis", "last_name": "Mendoza Chávez", "document_number": "40567890", "license_number": "Q45678901", "license_expiry": past_date(-30), "phone": "999444555", "email": "lmendoza@logistica.pe"},
    {"first_name": "Roberto", "last_name": "Silva Paredes", "document_number": "50678901", "license_number": "Q56789012", "license_expiry": past_date(30), "phone": "999555666", "email": "rsilva@logistica.pe"},
    {"first_name": "Carlos", "last_name": "Vargas Soto", "document_number": "60789012", "license_number": "Q67890123", "license_expiry": past_date(90), "phone": "999666777", "email": "cvargas@logistica.pe"},
    {"first_name": "Andrés", "last_name": "López Castillo", "document_number": "70890123", "license_number": "Q78901234", "license_expiry": past_date(150), "phone": "999777888", "email": "alopez@logistica.pe"},
    {"first_name": "José", "last_name": "Huanca Apaza", "document_number": "80901234", "license_number": "Q89012345", "license_expiry": past_date(200), "phone": "999888999", "email": "jhuanca@logistica.pe"},
]

# ---------------------------------------------------------------------------
# Vehicles
# ---------------------------------------------------------------------------

VEHICLES = [
    {"name": "Camión Volvo FH16", "plate_number": "ABC-123", "vehicle_type": "truck", "capacity_kg": "18000.00", "capacity_m3": "80.00"},
    {"name": "Camión Scania R450", "plate_number": "DEF-456", "vehicle_type": "truck", "capacity_kg": "22000.00", "capacity_m3": "95.00"},
    {"name": "Camión Mercedes Actros", "plate_number": "GHI-789", "vehicle_type": "truck", "capacity_kg": "20000.00", "capacity_m3": "90.00"},
    {"name": "Furgoneta Ford Transit", "plate_number": "JKL-012", "vehicle_type": "van", "capacity_kg": "3500.00", "capacity_m3": "12.00"},
    {"name": "Furgoneta Mercedes Sprinter", "plate_number": "MNO-345", "vehicle_type": "van", "capacity_kg": "3200.00", "capacity_m3": "11.00"},
    {"name": "Furgoneta Volkswagen Crafter", "plate_number": "PQR-678", "vehicle_type": "van", "capacity_kg": "3000.00", "capacity_m3": "10.50"},
    {"name": "Moto Honda CG150", "plate_number": "STU-901", "vehicle_type": "motorcycle", "capacity_kg": "50.00", "capacity_m3": "0.20"},
    {"name": "Moto Yamaha YBR125", "plate_number": "VWX-234", "vehicle_type": "motorcycle", "capacity_kg": "45.00", "capacity_m3": "0.18"},
    {"name": "Camión Isuzu NPR", "plate_number": "YZA-567", "vehicle_type": "truck", "capacity_kg": "7500.00", "capacity_m3": "35.00"},
    {"name": "Furgón refrigerado Renault Master", "plate_number": "BCD-890", "vehicle_type": "van", "capacity_kg": "2800.00", "capacity_m3": "9.00"},
]

# ---------------------------------------------------------------------------
# Products (need supplier_id, warehouse_id)
# ---------------------------------------------------------------------------

PRODUCT_TEMPLATES = [
    {"name": "Laptop HP ProBook 450", "sku": "TECH-001", "weight_kg": "2.100", "unit_price": "2850.00", "stock_quantity": 45, "length_cm": "36.0", "width_cm": "24.0", "height_cm": "2.5"},
    {"name": "Monitor Samsung 24\"", "sku": "TECH-002", "weight_kg": "3.500", "unit_price": "680.00", "stock_quantity": 80, "length_cm": "57.0", "width_cm": "38.0", "height_cm": "22.0"},
    {"name": "Teclado Logitech MX Keys", "sku": "TECH-003", "weight_kg": "0.810", "unit_price": "320.00", "stock_quantity": 120, "length_cm": "43.0", "width_cm": "13.0", "height_cm": "2.0"},
    {"name": "Silla ergonómica Steelcase", "sku": "MUEBLE-001", "weight_kg": "18.500", "unit_price": "1250.00", "stock_quantity": 30, "length_cm": "65.0", "width_cm": "65.0", "height_cm": "120.0"},
    {"name": "Escritorio modular 1.8m", "sku": "MUEBLE-002", "weight_kg": "45.000", "unit_price": "890.00", "stock_quantity": 15, "length_cm": "180.0", "width_cm": "80.0", "height_cm": "75.0"},
    {"name": "Cajas de cartón doble canal 40x30x30", "sku": "EMBALAJE-001", "weight_kg": "0.350", "unit_price": "3.50", "stock_quantity": 5000},
    {"name": "Plástico stretch film 500m", "sku": "EMBALAJE-002", "weight_kg": "2.200", "unit_price": "28.00", "stock_quantity": 200},
    {"name": "Pallets de madera 1.2x1m", "sku": "EMBALAJE-003", "weight_kg": "22.000", "unit_price": "45.00", "stock_quantity": 150},
    {"name": "Aceite de motor Mobil 1 5W30 (4L)", "sku": "AUTO-001", "weight_kg": "3.600", "unit_price": "85.00", "stock_quantity": 300},
    {"name": "Filtro de aire universal", "sku": "AUTO-002", "weight_kg": "0.450", "unit_price": "35.00", "stock_quantity": 180},
    {"name": "Neumático Bridgestone 205/55R16", "sku": "AUTO-003", "weight_kg": "8.500", "unit_price": "320.00", "stock_quantity": 60},
    {"name": "Medicamento Paracetamol 500mg (caja x100)", "sku": "FARM-001", "weight_kg": "0.250", "unit_price": "12.00", "stock_quantity": 1000},
    {"name": "Alcohol isopropílico 96% (1L)", "sku": "FARM-002", "weight_kg": "0.850", "unit_price": "18.00", "stock_quantity": 500},
    {"name": "Guantes quirúrgicos talla M (caja x100)", "sku": "FARM-003", "weight_kg": "0.800", "unit_price": "35.00", "stock_quantity": 800},
    {"name": "Harina de trigo extra (saco 50kg)", "sku": "ALIM-001", "weight_kg": "50.000", "unit_price": "120.00", "stock_quantity": 200},
    {"name": "Aceite vegetal La Favorita (caja x12 un)", "sku": "ALIM-002", "weight_kg": "12.000", "unit_price": "95.00", "stock_quantity": 350},
    {"name": "Azúcar rubia (saco 50kg)", "sku": "ALIM-003", "weight_kg": "50.000", "unit_price": "145.00", "stock_quantity": 180},
    {"name": "Cable UTP Cat6 (rollo 100m)", "sku": "ELEC-001", "weight_kg": "4.500", "unit_price": "95.00", "stock_quantity": 75},
    {"name": "Interruptor termomagnético 20A", "sku": "ELEC-002", "weight_kg": "0.280", "unit_price": "45.00", "stock_quantity": 200},
    {"name": "Cámara IP Hikvision 4MP", "sku": "ELEC-003", "weight_kg": "0.350", "unit_price": "250.00", "stock_quantity": 90},
]

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

ROUTE_TEMPLATES = [
    {"name": "Lima - Trujillo (Norte)", "distance_km": "557.00", "estimated_duration_h": "8.50"},
    {"name": "Lima - Arequipa (Sur)", "distance_km": "1009.00", "estimated_duration_h": "15.00"},
    {"name": "Lima - Callao (Local)", "distance_km": "14.00", "estimated_duration_h": "0.50"},
    {"name": "Lima - Huancayo (Sierra Central)", "distance_km": "305.00", "estimated_duration_h": "6.00"},
    {"name": "Trujillo - Piura (Norte)", "distance_km": "411.00", "estimated_duration_h": "6.50"},
    {"name": "Lima - Ica (Sur Chico)", "distance_km": "303.00", "estimated_duration_h": "4.50"},
]

CITIES = ["Lima", "Trujillo", "Arequipa", "Callao", "Huancayo", "Piura", "Ica", "Chiclayo", "Cusco", "Puno"]
ADDRESSES = [
    "Av. Javier Prado 1234", "Jr. Lampa 456", "Calle Los Pinos 789", "Av. La Marina 2340",
    "Calle Real 123", "Av. Progreso 567", "Jr. Comercio 890", "Av. Industrial 345",
    "Pasaje Los Jardines 12", "Calle Grau 678",
]

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    get_token()

    print("\n=== Creating Suppliers ===")
    supplier_ids = []
    for s in SUPPLIERS:
        obj = post("/suppliers/", s)
        if obj:
            supplier_ids.append(obj["id"])
            print(f"  + {s['name']}")

    print("\n=== Creating Warehouses ===")
    warehouse_ids = []
    for w in WAREHOUSES:
        obj = post("/warehouses/", w)
        if obj:
            warehouse_ids.append(obj["id"])
            print(f"  + {w['name']}")

    if not supplier_ids or not warehouse_ids:
        print("ERROR: need suppliers and warehouses first")
        return

    print("\n=== Creating Customers ===")
    customer_ids = []
    for c in CUSTOMERS:
        obj = post("/customers/", c)
        if obj:
            customer_ids.append(obj["id"])
            print(f"  + {c['name']}")

    print("\n=== Creating Drivers ===")
    driver_ids = []
    for d in DRIVERS:
        obj = post("/drivers/", d)
        if obj:
            driver_ids.append(obj["id"])
            print(f"  + {d['first_name']} {d['last_name']}")

    print("\n=== Creating Vehicles ===")
    vehicle_ids = []
    for i, v in enumerate(VEHICLES):
        data = dict(v)
        if driver_ids and i < len(driver_ids):
            data["driver"] = driver_ids[i]
        obj = post("/vehicles/", data)
        if obj:
            vehicle_ids.append(obj["id"])
            print(f"  + {v['name']} ({v['plate_number']})")

    print("\n=== Creating Products ===")
    product_ids = []
    for i, p in enumerate(PRODUCT_TEMPLATES):
        data = dict(p)
        data["supplier"] = supplier_ids[i % len(supplier_ids)]
        data["warehouse"] = warehouse_ids[i % len(warehouse_ids)]
        obj = post("/products/", data)
        if obj:
            product_ids.append(obj["id"])
            print(f"  + {p['name']}")

    # Re-fetch products with prices for shipment items
    products_with_prices = {item["id"]: item["unit_price"] for item in get_list("/products/")}

    print("\n=== Creating Routes ===")
    route_ids = []
    for i, rt in enumerate(ROUTE_TEMPLATES):
        data = dict(rt)
        data["origin_warehouse"] = warehouse_ids[i % len(warehouse_ids)]
        obj = post("/routes/", data)
        if obj:
            route_ids.append(obj["id"])
            print(f"  + {rt['name']}")

    print("\n=== Creating Shipments (180 days of data) ===")
    STATUSES = ["pending", "assigned", "in_transit", "delivered", "delivered", "delivered", "cancelled", "returned"]
    # Weight toward delivered for realistic historical data
    shipment_count = 0

    for days_ago in range(180, 0, -1):
        # 0-3 shipments per day, more recent days have more
        n = random.choices([0, 1, 2, 3], weights=[30, 35, 25, 10])[0]
        if days_ago < 30:
            n = random.choices([0, 1, 2, 3, 4], weights=[15, 30, 30, 15, 10])[0]

        for _ in range(n):
            shipment_date = date.today() - timedelta(days=days_ago)

            # Status logic: older = more likely delivered
            if days_ago > 14:
                status = random.choices(
                    ["delivered", "delivered", "delivered", "cancelled", "returned"],
                    weights=[60, 15, 10, 10, 5]
                )[0]
                # Just pick "delivered" or "cancelled" for old ones
                status = random.choices(
                    ["delivered", "cancelled", "returned"],
                    weights=[80, 15, 5]
                )[0]
            else:
                status = random.choices(
                    ["pending", "assigned", "in_transit", "delivered", "cancelled"],
                    weights=[20, 20, 30, 25, 5]
                )[0]

            customer_id = random.choice(customer_ids)
            warehouse_id = random.choice(warehouse_ids)
            vehicle_id = random.choice(vehicle_ids) if vehicle_ids else None
            route_id = random.choice(route_ids) if route_ids else None
            city = random.choice(CITIES)
            address = random.choice(ADDRESSES)

            base_cost = rand_decimal(150, 2500)
            calculated_cost = round(base_cost * random.uniform(1.0, 1.3), 2)

            delivered_at = None
            if status == "delivered":
                delivered_at = (datetime.combine(shipment_date, datetime.min.time()) + timedelta(days=random.randint(1, 5))).isoformat()

            tracking = f"TRK{shipment_date.strftime('%Y%m%d')}{random.randint(100,999)}"

            shipment_data = {
                "tracking_number": tracking,
                "customer": customer_id,
                "origin_warehouse": warehouse_id,
                "destination_address": address,
                "destination_city": city,
                "destination_country": "Peru",
                "status": status,
                "scheduled_date": (shipment_date + timedelta(days=random.randint(1, 3))).isoformat(),
                "base_cost": str(base_cost),
                "calculated_cost": str(calculated_cost),
            }
            if vehicle_id:
                shipment_data["vehicle"] = vehicle_id
            if route_id:
                shipment_data["route"] = route_id
            if delivered_at:
                shipment_data["delivered_at"] = delivered_at

            shipment = post("/shipments/", shipment_data)
            if not shipment:
                continue

            shipment_count += 1

            # Add 1-4 items per shipment
            n_items = random.randint(1, 4)
            used_products = random.sample(product_ids, min(n_items, len(product_ids)))
            for pid in used_products:
                price = products_with_prices.get(pid, "50.00")
                post("/shipment-items/", {
                    "shipment": shipment["id"],
                    "product": pid,
                    "quantity": random.randint(1, 20),
                    "unit_price_at_shipment": price,
                })

    print(f"  ✓ Created {shipment_count} shipments")
    print("\n✅ Demo data complete!")
    print(f"   Suppliers:  {len(supplier_ids)}")
    print(f"   Warehouses: {len(warehouse_ids)}")
    print(f"   Customers:  {len(customer_ids)}")
    print(f"   Drivers:    {len(driver_ids)}")
    print(f"   Vehicles:   {len(vehicle_ids)}")
    print(f"   Products:   {len(product_ids)}")
    print(f"   Routes:     {len(route_ids)}")
    print(f"   Shipments:  {shipment_count}")


if __name__ == "__main__":
    main()
