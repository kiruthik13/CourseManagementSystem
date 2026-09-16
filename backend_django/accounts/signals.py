"""
Post-save signal to log user creation events.
Wired up in AccountsConfig.ready() to avoid duplicate registration.
"""
import logging

from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)

User = get_user_model()


@receiver(post_save, sender=User)
def log_user_creation(sender, instance, created, **kwargs):
    """Log every new user creation (without sensitive data)."""
    if created:
        logger.info(
            "New user created — id=%s email=%s role=%s",
            instance.pk,
            instance.email,
            instance.role,
        )
