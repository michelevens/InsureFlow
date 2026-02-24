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
                You've Received an Insurance Quote
            </h1>

            <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
                Hi <strong>{{ $consumerName }}</strong>, <strong>{{ $agentName }}</strong> from <strong>{{ $agencyName }}</strong> has prepared a personalized insurance quote for you.
            </p>

            <div style="background: #f0fdfa; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
                <p style="color: #0d9488; font-size: 14px; font-weight: 600; margin: 0;">
                    {{ $scenarioName }}
                </p>
            </div>

            <div style="text-align: center;">
                <a href="{{ $viewUrl }}" style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0ea5e9); color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                    View Your Quote
                </a>
            </div>

            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px; line-height: 1.5;">
                Review the coverage details and accept or decline the quote at your convenience.
            </p>
        </div>

        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 24px;">
            &copy; {{ date('Y') }} Insurons. All rights reserved.
        </p>
    </div>
</body>
</html>
