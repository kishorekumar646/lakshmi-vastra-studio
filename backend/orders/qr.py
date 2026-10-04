import io
import base64

try:
    import qrcode
    _qrcode_available = True
except ImportError:
    _qrcode_available = False


def generate_qr_base64(token: str) -> str:
    if not _qrcode_available:
        # Fallback: return a 1x1 transparent PNG so the endpoint doesn't crash locally
        _BLANK = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        return f"data:image/png;base64,{_BLANK}"
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=6,
        border=2,
    )
    qr.add_data(token)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64 = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{b64}"
