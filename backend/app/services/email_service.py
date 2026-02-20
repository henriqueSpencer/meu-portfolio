import smtplib
from email.mime.text import MIMEText

from ..config import settings


async def send_verification_email(email: str, token: str):
    verify_url = f"{settings.email_verify_url}?verify_token={token}"
    subject = "Dash Financeiro - Verificacao de Email"
    body = (
        f"Ola!\n\n"
        f"Para verificar seu email, acesse o link abaixo:\n\n"
        f"{verify_url}\n\n"
        f"Se voce nao solicitou este cadastro, ignore este email."
    )

    if settings.smtp_host:
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = settings.smtp_from or settings.smtp_user
        msg["To"] = email

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(msg["From"], [email], msg.as_string())

        print(f"[email] Verification email sent to {email}")
    else:
        print(f"[email] SMTP not configured. Verification link for {email}:")
        print(f"[email] {verify_url}")
