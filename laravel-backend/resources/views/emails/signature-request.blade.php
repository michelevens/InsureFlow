<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 0;">
    <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0ea5e9); border-radius: 12px; padding: 10px;">
                    <span style="color: white; font-weight: bold; font-size: 18px;">Insurons</span>
                </div>
            </div>

            <h1 style="font-size: 20px; color: #1e293b; margin: 0 0 12px 0; text-align: center;">
                Signature Requested
            </h1>

            <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
                Hi <strong>{{ $signerName }}</strong>, <strong>{{ $requesterName }}</strong> has requested your signature on an insurance document.
            </p>

            @if($message)
            <div style="background: #f1f5f9; border-left: 3px solid #0d9488; border-radius: 0 8px 8px 0; padding: 16px; margin-bottom: 24px;">
                <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0; font-style: italic;">
                    "{{ $message }}"
                </p>
            </div>
            @endif

            <div style="text-align: center;">
                <a href="{{ $signUrl }}" style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0ea5e9); color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                    Review & Sign
                </a>
            </div>

            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px; line-height: 1.5;">
                By signing, you confirm that you have reviewed the document and agree to its terms.
            </p>
        </div>

        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 24px;">
            &copy; {{ date('Y') }} Insurons. All rights reserved.
        </p>
    </div>
</body>
</html>
