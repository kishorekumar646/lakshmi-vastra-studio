import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv(".env")

from database import SessionLocal, engine, Base
from models import Category, Product

Base.metadata.create_all(bind=engine)
db = SessionLocal()

db.query(Product).delete()
db.query(Category).delete()
db.commit()
print("✓ Cleared existing data")

# Categories
categories_data = [
    {"name": "Silk Sarees",   "slug": "silk-sarees"},
    {"name": "Cotton Sarees", "slug": "cotton-sarees"},
    {"name": "Lehengas",      "slug": "lehengas"},
    {"name": "Salwar Kameez", "slug": "salwar-kameez"},
    {"name": "Dupattas",      "slug": "dupattas"},
]

cats = {}
for c in categories_data:
    cat = Category(name=c["name"], slug=c["slug"])
    db.add(cat)
    db.flush()
    cats[c["slug"]] = cat.id
    print(f"✓ Category: {c['name']}")

db.commit()

# picsum.photos — reliable, no API key needed
# seed/ makes each URL return the same image every time
products_data = [
    {
        "name": "Kanjivaram Pure Silk Saree",
        "description": "Handwoven pure Kanjivaram silk saree with traditional gold zari border. Perfect for weddings and festivals.",
        "price": 8500,
        "category_slug": "silk-sarees",
        "is_featured": True,
        "image_url": "https://source.unsplash.com/600x800/?silk,saree&sig=1",
    },
    {
        "name": "Banarasi Silk Saree",
        "description": "Premium Banarasi silk saree with intricate brocade work. A timeless classic for special occasions.",
        "price": 12000,
        "category_slug": "silk-sarees",
        "is_featured": True,
        "image_url": "https://source.unsplash.com/600x800/?indian,saree&sig=2",
    },
    {
        "name": "Mysore Silk Saree",
        "description": "Lightweight Mysore silk saree with delicate zari border. Ideal for daily wear and office.",
        "price": 4200,
        "category_slug": "silk-sarees",
        "is_featured": False,
        "image_url": "https://source.unsplash.com/600x800/?silk,saree&sig=3",
    },
    {
        "name": "Handloom Cotton Saree",
        "description": "Pure handloom cotton saree with beautiful block print design. Comfortable for everyday wear.",
        "price": 1800,
        "category_slug": "cotton-sarees",
        "is_featured": True,
        "image_url": "https://source.unsplash.com/600x800/?cotton,saree&sig=4",
    },
    {
        "name": "Chanderi Cotton Saree",
        "description": "Elegant Chanderi cotton saree with sheer texture and golden motifs. Perfect for festive occasions.",
        "price": 2800,
        "category_slug": "cotton-sarees",
        "is_featured": False,
        "image_url": "https://source.unsplash.com/600x800/?indian,fashion&sig=5",
    },
    {
        "name": "Bridal Lehenga — Red & Gold",
        "description": "Stunning red bridal lehenga with heavy gold embroidery. Complete set with choli and dupatta.",
        "price": 25000,
        "category_slug": "lehengas",
        "is_featured": True,
        "image_url": "https://source.unsplash.com/600x800/?indian,bridal&sig=6",
    },
    {
        "name": "Designer Lehenga — Pink",
        "description": "Beautiful pink designer lehenga with floral embroidery. Perfect for receptions and sangeet.",
        "price": 15000,
        "category_slug": "lehengas",
        "is_featured": True,
        "image_url": "https://source.unsplash.com/600x800/?lehenga,indian&sig=7",
    },
    {
        "name": "Anarkali Salwar Kameez",
        "description": "Floor-length Anarkali suit with heavy embroidery. Comes with matching churidar and dupatta.",
        "price": 5500,
        "category_slug": "salwar-kameez",
        "is_featured": False,
        "image_url": "https://source.unsplash.com/600x800/?indian,dress&sig=8",
    },
    {
        "name": "Straight Cut Salwar Suit",
        "description": "Elegant straight cut salwar suit in georgette fabric. Ideal for office and casual occasions.",
        "price": 3200,
        "category_slug": "salwar-kameez",
        "is_featured": False,
        "image_url": "https://source.unsplash.com/600x800/?ethnic,fashion&sig=9",
    },
    {
        "name": "Silk Dupatta — Zari Border",
        "description": "Pure silk dupatta with golden zari border. Can be paired with any suit or lehenga.",
        "price": 1200,
        "category_slug": "dupattas",
        "is_featured": False,
        "image_url": "https://source.unsplash.com/600x800/?indian,textile&sig=10",
    },
]

for p in products_data:
    slug = p.pop("category_slug")
    product = Product(category_id=cats[slug], is_available=True, **p)
    db.add(product)
    print(f"✓ Product: {p['name']} — ₹{p['price']}")

db.commit()
db.close()
print("\n✅ Done! Refresh http://localhost:5173")
