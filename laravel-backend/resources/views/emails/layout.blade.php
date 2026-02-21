{{--
    InsureFlow Email Template Reference
    ====================================

    This file documents the shared design system used across all InsureFlow email templates.
    Each email is STANDALONE with all inline styles — no @include or @extends used.

    COLOR PALETTE
    ─────────────
    Primary Gradient:  #0f766e (teal-700) → #0ea5e9 (sky-500)
    Background:        #f0fdfa (teal-50)
    Accent:            #14b8a6 (teal-500)
    Text Dark:         #134e4a (teal-900)
    Text Muted:        #64748b (slate-500)
    Info Card BG:      linear-gradient(135deg, #f0fdfa, #ccfbf1)
    Info Card Border:  #99f6e4 (teal-200)
    Footer BG:         #f8fafc
    Footer Border:     #e2e8f0 (slate-200)

    BRAND
    ─────
    Name:    InsureFlow
    Tagline: Insurance Marketplace
    Logo:    &#128737; shield icon or text-based shield styling

    STRUCTURE (every email follows this)
    ─────────────────────────────────────
    1. <body> background: #f0fdfa, padding 40px 20px
    2. Centered table max-width: 600px
    3. Top accent bar: 6px, gradient #0f766e → #0ea5e9, border-radius 12px 12px 0 0
    4. White card: bg #fff, border-radius 0 0 16px 16px, box-shadow 0 4px 24px rgba(0,0,0,0.08)
    5. Header: gradient 135deg #0f766e 0%, #0d9488 50%, #0ea5e9 100%, padding 40px 48px
       - Brand icon + "InsureFlow" text (26px bold white)
       - Tagline: "Insurance Marketplace" (13px, uppercase, 2px letter-spacing, rgba white 0.8)
    6. Icon section: 72px circle, gradient #f0fdfa → #ccfbf1, centered emoji/icon
    7. Body: padding 24px 48px 40px
       - H1: #134e4a, 24px, bold, centered
       - Body text: #64748b, 15px
       - Info cards: gradient bg, teal border, 14px radius
       - Bullets: &#9679; prefix, #475569
    8. CTA button: #0f766e bg, white text, 16px 36px padding, 12px border-radius, 15px bold
    9. Footer: #f8fafc bg, 1px #e2e8f0 top border, padding 24px 48px
       - "InsureFlow" (13px, 600 weight, #64748b)
       - "Your trusted insurance marketplace" (12px, #94a3b8)
       - Copyright: {{ date('Y') }} (11px, #cbd5e1)

    TEMPLATES
    ─────────
    1.  welcome.blade.php           — $user
    2.  email-verification.blade.php — $user, $verificationUrl
    3.  password-reset.blade.php     — $user, $resetUrl
    4.  quote-received.blade.php     — $firstName, $email, $quoteCount, $lowestPremium
    5.  application-status.blade.php — $user, $applicationId, $status, $insuranceType
    6.  lead-assigned.blade.php      — $agent, $leadName, $leadEmail, $insuranceType, $estimatedValue
    7.  invitation.blade.php         — $inviterName, $agencyName, $inviteUrl, $role
    8.  account-approved.blade.php   — $user
    9.  registration-received.blade.php — $user

    FRONTEND URL
    ─────────────
    env('FRONTEND_URL', 'https://insureflow.com')
--}}
