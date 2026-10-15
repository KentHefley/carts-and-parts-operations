# Resend sending domain — October 15, 2026

Added `orders.cartsandparts.com` to the signed-in cartsandparts Resend team. Domain ID: `36623abb-ff39-47d6-84bd-d8b81f8d1a29`. Confirmed saved in Domains list, status **Not Started**. Region North Virginia (us-east-1); sending enabled, receiving disabled. No DNS/provider changes made and no emails sent. App sender and its single-recipient restriction remain unchanged until verification and authorized configuration.

Resend displayed these three records. Names below are relative to the `cartsandparts.com` DNS zone; confirm the provider's host-name format before adding. Leave existing website/mail records and nameservers intact. These are public DNS values, not API credentials.

| Type | Name | Content | TTL |
| --- | --- | --- | --- |
| TXT | resend._domainkey.orders | p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC9VBwoAwrEXgn5Gy357TyyXqOBayMEmBzUPCBKy7e67+qI8a+K732L4+xWaBw505k3w8A6Vx2lmiISGe4yEPrKH+ireL+nISKLD/5DoNzfLce99yXwl/nzFxiKVSmzctpnQwQc4XZ3xxVcWo/OJS7GfXak5+ApcRpfgLecfqc2GwIDAQAB | Auto |
| CNAME | rsend.orders | rsend.forge.rmta.net | Auto |
| CNAME | send.orders | send.forge.rmta.net | Auto |

Next: user adds these records at the authoritative DNS provider, then verify in Resend. Do not click “I've added the records” until records are actually added. Confirm sender and reply-to, update the server-side development SO recipient allowlist, and test actual delivery to authorized assignees. User limited this step to Resend; Network Solutions is untouched.

October 15 verified: Resend reports the domain and all three records Verified. Kent approved sender sales-orders@orders.cartsandparts.com, reply-to kent@cartsandparts.com, and development SO recipients kent@cartsandparts.com, jleo3140@gmail.com, augustforum@gmail.com, hefleykent@gmail.com. New email snapshots include the sender and reply-to; stored historical attempts retain their original payload for safe idempotent retries. Invitation recipients remain separate. Actual multi-recipient delivery is the next manual check.
