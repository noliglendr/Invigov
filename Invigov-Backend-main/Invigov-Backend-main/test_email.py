"""
Test Resend email notification functionality
Run this script to verify Resend configuration is working

Usage:
    python test_email.py your-email@example.com
"""

import sys
from datetime import date, timedelta
from app.core.config import settings

# Check if Resend is configured
if not settings.RESEND_API_KEY or settings.RESEND_API_KEY == "":
    print("❌ ERROR: RESEND_API_KEY not configured in .env file")
    print("\nPlease add your Resend API key:")
    print("RESEND_API_KEY=re_xxxxxx...")
    sys.exit(1)

if not settings.FRONTEND_URL or settings.FRONTEND_URL == "":
    print("❌ ERROR: FRONTEND_URL not configured in .env file")
    print("\nPlease add your frontend URL:")
    print("FRONTEND_URL=https://app.yourdomain.com")
    sys.exit(1)

print("✅ Resend API Key configured")
print(f"✅ Frontend URL: {settings.FRONTEND_URL}")
print()

# Get recipient email from command line
if len(sys.argv) < 2:
    print("Usage: python test_email.py your-email@example.com")
    sys.exit(1)

recipient_email = sys.argv[1]
print(f"📧 Sending test email to: {recipient_email}")
print()

# Import email sending function
from app.workers.notifications import _send_deadline_email

# Test data
test_workspace_name = "Test Workspace"
test_deadline_title = "SAM.gov Registration Renewal"
test_deadline_date = date.today() + timedelta(days=7)
test_days_remaining = 7
test_deadline_type = "sam_renewal"

try:
    print("Sending email...")
    response = _send_deadline_email(
        to_email=recipient_email,
        workspace_name=test_workspace_name,
        deadline_title=test_deadline_title,
        deadline_date=test_deadline_date,
        days_remaining=test_days_remaining,
        deadline_type=test_deadline_type
    )

    print(f"✅ Email sent successfully!")
    print(f"   Email ID: {response.get('id', 'N/A')}")
    print()
    print("📬 Check your inbox (and spam folder) for the test email.")
    print()
    print("Email details:")
    print(f"   Subject: [CRITICAL] {test_deadline_title} - {test_days_remaining} days remaining")
    print(f"   From: {settings.EMAIL_FROM}")
    print(f"   To: {recipient_email}")

except ValueError as e:
    print(f"❌ Configuration Error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Failed to send email: {e}")
    print()
    print("Common issues:")
    print("1. Invalid Resend API key")
    print("2. Sender domain not verified in Resend")
    print("3. Network connectivity issues")
    sys.exit(1)
