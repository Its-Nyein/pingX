# Security Policy

pingX is a personal project. There is no production deployment holding other
people's data, so this policy is short.

## Reporting

Please do not open a public issue for a security problem. Report privately
through
[GitHub private vulnerability reporting](https://github.com/itsnyein/pingX/security/advisories/new),
or email **nyeinphyoaung.edu@gmail.com** with `[pingX security]` in the subject.
Steps to reproduce and the affected commit are the two things that help most.

I will acknowledge within a week. Fixes land on `main`; there are no backport
branches.

## Scope

Authentication and session handling, cross-account access, the event ingestion
API and its key handling, the Stripe webhook signature check, and secret
exposure in responses, logs or the client bundle. Vulnerabilities in Neon,
Stripe, Discord or Netlify belong to those vendors. See **Known limitations** in
`README.md` for gaps that are already known and intentional.
