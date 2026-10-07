from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    products = relationship("Product", back_populates="category")


class ShopOwner(Base):
    __tablename__ = "shop_owners"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(200), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    shop_name = Column(String(200), nullable=False)
    phone = Column(String(20))
    hashed_password = Column(String(200), nullable=False)
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    profile_image_url = Column(String(500), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    gst_number = Column(String(20), nullable=True)
    bank_account_holder = Column(String(200), nullable=True)
    bank_name = Column(String(200), nullable=True)
    bank_account_number = Column(String(30), nullable=True)
    bank_ifsc = Column(String(20), nullable=True)
    bank_account_type = Column(String(20), nullable=True)  # Savings / Current

    products = relationship("Product", back_populates="shop_owner")


class DeliveryPerson(Base):
    __tablename__ = "delivery_persons"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(200), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20))
    hashed_password = Column(String(200), nullable=False)
    is_active = Column(Boolean, default=True)
    earning_per_delivery = Column(Float, default=50.0)
    vehicle_type = Column(String(50))       # Bike, Bicycle, Auto, etc.
    vehicle_number = Column(String(50))     # registration number
    licence_number = Column(String(50))
    pan_card = Column(String(20))
    licence_image_url = Column(String(500))
    pan_image_url = Column(String(500))
    profile_complete = Column(Boolean, default=False)
    profile_image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    bank_account_holder = Column(String(200), nullable=True)
    bank_name = Column(String(200), nullable=True)
    bank_account_number = Column(String(30), nullable=True)
    bank_ifsc = Column(String(20), nullable=True)
    bank_account_type = Column(String(20), nullable=True)  # Savings / Current

    assigned_orders = relationship("Order", foreign_keys="Order.delivery_person_id", back_populates="delivery_person")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    image_url = Column(String(500))
    image_public_id = Column(String(200))
    category_id = Column(Integer, ForeignKey("categories.id"))
    shop_owner_id = Column(Integer, ForeignKey("shop_owners.id"), nullable=True)
    is_featured = Column(Boolean, default=False)
    is_available = Column(Boolean, default=True)
    is_handloom = Column(Boolean, default=False)
    has_multiple_colours = Column(Boolean, default=False)
    custom_orders = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    category = relationship("Category", back_populates="products")
    shop_owner = relationship("ShopOwner", back_populates="products")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")
    images = relationship(
        "ProductImage",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductImage.sort_order",
    )


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"))
    image_url = Column(String(500), nullable=False)
    image_public_id = Column(String(200))
    sort_order = Column(Integer, default=0)

    product = relationship("Product", back_populates="images")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    reviewer_name = Column(String(100), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    is_visible = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="reviews")


class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(200))
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(200), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20))
    secondary_phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    profile_image_url = Column(String(500), nullable=True)
    hashed_password = Column(String(200), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    cart_items = relationship("CartItem", back_populates="customer", cascade="all, delete-orphan")
    wishlist_items = relationship("WishlistItem", back_populates="customer", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="customer")


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"))
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"))
    quantity = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="cart_items")
    product = relationship("Product")


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"))
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="wishlist_items")
    product = relationship("Product")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    total = Column(Float, nullable=False)
    status = Column(String(50), default="pending")
    payment_method = Column(String(20), default="razorpay")  # razorpay | cod
    razorpay_order_id = Column(String(200))
    razorpay_payment_id = Column(String(200))
    delivery_address = Column(Text)
    delivery_person_id = Column(Integer, ForeignKey("delivery_persons.id"), nullable=True)
    qr_token = Column(String(100), unique=True, index=True)
    delivery_otp = Column(String(6), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    return_status = Column(String(20), nullable=True)   # pending | accepted | rejected | returned
    return_reason = Column(Text, nullable=True)
    return_note = Column(Text, nullable=True)
    return_requested_at = Column(DateTime(timezone=True), nullable=True)
    return_delivery_person_id = Column(Integer, ForeignKey("delivery_persons.id"), nullable=True)
    return_delivery_status = Column(String(30), nullable=True)  # pickup_accepted | picked_up_from_customer | returned_to_shop
    refund_status = Column(String(20), nullable=True)   # pending | refunded (null = no refund needed / COD)

    customer = relationship("Customer", back_populates="orders")
    delivery_person = relationship("DeliveryPerson", foreign_keys=[delivery_person_id], back_populates="assigned_orders")
    return_delivery_person = relationship("DeliveryPerson", foreign_keys=[return_delivery_person_id])
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship(
        "OrderStatusHistory",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderStatusHistory.created_at",
    )


class ShopProduct(Base):
    """Junction table — one product can be carried by multiple shops."""
    __tablename__ = "shop_products"

    id = Column(Integer, primary_key=True, index=True)
    shop_owner_id = Column(Integer, ForeignKey("shop_owners.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    price_override = Column(Float, nullable=True)   # None = use base product price
    is_available = Column(Boolean, default=True)

    shop_owner = relationship("ShopOwner")
    product = relationship("Product")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"))
    product_id = Column(Integer, ForeignKey("products.id"))
    shop_owner_id = Column(Integer, ForeignKey("shop_owners.id"), nullable=True)  # snapshot at order time
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    shop_owner = relationship("ShopOwner")


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_type = Column(String(30), nullable=False)  # admin | shop_owner | delivery_person | customer
    user_id = Column(Integer, nullable=True)
    endpoint = Column(Text, unique=True, nullable=False)
    p256dh = Column(Text, nullable=False)
    auth = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False)
    note = Column(String(200))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="status_history")


class DeliveryPincode(Base):
    __tablename__ = "delivery_pincodes"

    id = Column(Integer, primary_key=True, index=True)
    pincode = Column(String(10), unique=True, nullable=False, index=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
