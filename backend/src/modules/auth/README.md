# Auth Module

This folder is reserved for Stackem-owned auth code if you later migrate away from the common backend.

Right now:

- frontend login/register still use the common backend auth rules
- token/session ownership is not duplicated here yet

When you migrate, mirror the shared auth contract instead of inventing a second login format.
