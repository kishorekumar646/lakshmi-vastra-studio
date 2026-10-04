"""Run once: python generate_vapid_keys.py  →  copy output into .env"""
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
import base64

key = ec.generate_private_key(ec.SECP256R1(), default_backend())

private_der = key.private_bytes(
    encoding=serialization.Encoding.DER,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption(),
)
public_uncompressed = key.public_key().public_bytes(
    encoding=serialization.Encoding.X962,
    format=serialization.PublicFormat.UncompressedPoint,
)

private_b64 = base64.urlsafe_b64encode(private_der).rstrip(b"=").decode()
public_b64 = base64.urlsafe_b64encode(public_uncompressed).rstrip(b"=").decode()

print("Add these to your .env and Render environment variables:\n")
print(f"VAPID_PRIVATE_KEY={private_b64}")
print(f"VAPID_PUBLIC_KEY={public_b64}")
print(f"VAPID_CLAIMS_EMAIL=admin@yourdomain.com")
