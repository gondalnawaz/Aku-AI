import ipaddress
import json
from typing import Optional
from urllib.request import Request, urlopen

from fastapi import APIRouter, Request as FastAPIRequest

router = APIRouter()

SUPPORTED_LANGUAGES = {"en", "es", "fr", "de", "ar", "tr", "ru", "zh"}
SUPPORTED_CURRENCIES = {"GBP", "EUR", "USD"}

COUNTRY_LANGUAGE_MAP = {
    "GB": "en", "US": "en", "CA": "en", "AU": "en", "NZ": "en", "IE": "en",
    "ES": "es", "MX": "es", "AR": "es", "CO": "es", "CL": "es", "PE": "es", "UY": "es",
    "FR": "fr", "BE": "fr", "CH": "fr", "LU": "fr",
    "DE": "de", "AT": "de",
    "SA": "ar", "AE": "ar", "EG": "ar", "IQ": "ar", "JO": "ar", "KW": "ar", "QA": "ar", "OM": "ar", "BH": "ar", "LB": "ar", "MA": "ar", "DZ": "ar", "TN": "ar",
    "TR": "tr",
    "RU": "ru", "BY": "ru", "KZ": "ru", "KG": "ru",
    "CN": "zh", "HK": "zh", "MO": "zh", "TW": "zh", "SG": "zh",
}

COUNTRY_CURRENCY_MAP = {
    "GB": "GBP",
    "US": "USD", "CA": "USD", "AU": "USD", "NZ": "USD", "SG": "USD",
    "ES": "EUR", "FR": "EUR", "DE": "EUR", "IT": "EUR", "PT": "EUR", "NL": "EUR", "BE": "EUR", "AT": "EUR", "IE": "EUR", "FI": "EUR", "LU": "EUR", "GR": "EUR", "CY": "EUR", "MT": "EUR", "EE": "EUR", "LV": "EUR", "LT": "EUR", "SK": "EUR", "SI": "EUR", "HR": "EUR",
    "RU": "EUR", "TR": "EUR",
}


def _is_public_ip(ip_text: str) -> bool:
    try:
        ip_obj = ipaddress.ip_address(ip_text)
        return not (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_link_local
            or ip_obj.is_multicast
            or ip_obj.is_reserved
            or ip_obj.is_unspecified
        )
    except ValueError:
        return False


def _extract_client_ip(request: FastAPIRequest) -> Optional[str]:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        for ip in [part.strip() for part in forwarded_for.split(",") if part.strip()]:
            if _is_public_ip(ip):
                return ip

    real_ip = request.headers.get("x-real-ip", "").strip()
    if real_ip and _is_public_ip(real_ip):
        return real_ip

    if request.client and request.client.host and _is_public_ip(request.client.host):
        return request.client.host

    return None


def _geo_lookup(ip: Optional[str]) -> dict:
    endpoint = f"https://ipapi.co/{ip}/json/" if ip else "https://ipapi.co/json/"
    req = Request(endpoint, headers={"User-Agent": "precisionboard-ai/1.0"})

    with urlopen(req, timeout=3) as res:
        payload = res.read().decode("utf-8")
        data = json.loads(payload)

    return {
        "country": (data.get("country_code") or "").upper(),
        "city": data.get("city") or "",
        "timezone": data.get("timezone") or "",
    }


def _resolve_language(country_code: str) -> str:
    lang = COUNTRY_LANGUAGE_MAP.get(country_code, "en")
    return lang if lang in SUPPORTED_LANGUAGES else "en"


def _resolve_currency(country_code: str) -> str:
    currency = COUNTRY_CURRENCY_MAP.get(country_code, "GBP")
    return currency if currency in SUPPORTED_CURRENCIES else "GBP"


@router.get("/auto")
def detect_locale(request: FastAPIRequest):
    client_ip = _extract_client_ip(request)

    country = ""
    city = ""
    timezone = ""

    try:
        geo = _geo_lookup(client_ip)
        country = geo["country"]
        city = geo["city"]
        timezone = geo["timezone"]
    except Exception:
        pass

    language = _resolve_language(country)
    currency = _resolve_currency(country)

    return {
        "language": language,
        "currency": currency,
        "country": country,
        "city": city,
        "timezone": timezone,
    }
