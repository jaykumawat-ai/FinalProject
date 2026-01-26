import razorpay
from app.config import settings

razorpay_client = razorpay.Client(
    auth=(settings.razorpay_key_id, settings.razorpay_key_secret)
)
