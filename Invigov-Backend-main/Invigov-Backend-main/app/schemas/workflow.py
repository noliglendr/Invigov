from pydantic import BaseModel
from typing import List, Optional


class BusinessInfoRequest(BaseModel):
    legal_name: str
    dba_name: Optional[str] = None
    ein: str                          # encrypted before storage
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    zip_code: str
    business_type: str
    uei_number: Optional[str] = None


class NaicsCodesRequest(BaseModel):
    naics_codes: List[str]
    primary_naics: str
    annual_receipts_avg: Optional[int] = None
    total_employees: Optional[int] = None


class BankingInfoRequest(BaseModel):
    routing_number: str               # encrypted before storage
    account_number: str               # encrypted before storage
    account_holder: str
    bank_name: str


class RepsCertsRequest(BaseModel):
    responses: dict                   # {far_clause: {question_id: answer}}
