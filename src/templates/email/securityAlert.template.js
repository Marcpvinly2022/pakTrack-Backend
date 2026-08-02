/**
 * --------------------------------------------------------------------------
 * PakTrack Security Alert Email Template
 * --------------------------------------------------------------------------
 * Sent when suspicious activity (e.g. refresh token reuse) forces a full
 * session revocation on an account.
 */
export const securityAlertTemplate = ({ firstName }) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta name="x-apple-disable-message-reformatting" />
    <title>Security Alert</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; background-color:#F8FAFC; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F8FAFC; padding:48px 16px;">
        <tr>
            <td align="center">
                <!-- Wrapper Box -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px; background-color:#FFFFFF; border-radius:16px; box-shadow:0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border:1px solid #E2E8F0; overflow:hidden;">

                    <!-- Header/Branding Strip -->
                    <tr>
                        <td style="padding:32px 40px 0 40px; font-weight:800; font-size:22px; color:#0F172A; tracking:-0.05em;">
                           Pak<span style="color:#2563EB;">Track</span>
                        </td>
                    </tr>

                    <!-- Main Content Body -->
                    <tr>
                        <td style="padding:24px 40px 40px 40px;">
                            <h2 style="margin:0 0 16px 0; font-size:20px; font-weight:700; color:#B91C1C; line-height:1.3;">
                                Suspicious activity detected
                            </h2>
                            <p style="margin:0 0 20px 0; font-size:15px; color:#475569; line-height:1.6;">
                                Hello ${firstName ?? "there"},
                            </p>
                            <p style="margin:0 0 28px 0; font-size:15px; color:#475569; line-height:1.6;">
                                We detected unusual activity on your PakTrack account and, as a precaution, we have signed you out of <strong>all active sessions</strong> and revoked existing access.
                            </p>

                            <!-- Urgent Security Callout Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FEF2F2; border-left:4px solid #DC2626; border-radius:4px; margin:0 0 24px 0;">
                                <tr>
                                    <td style="padding:14px 16px; font-size:13px; color:#991B1B; line-height:1.5; font-weight:500;">
                                        🔒 If this was not you, please <strong>reset your password immediately</strong> and contact your agency administrator.
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:0 0 32px 0; font-size:13px; color:#64748B; line-height:1.6;">
                                If this was you, simply log in again to continue where you left off. No further action is required.
                            </p>

                            <!-- Separation Rule -->
                            <hr style="border:0; border-top:1px solid #E2E8F0; margin:0 0 24px 0;" />

                            <p style="margin:0; font-size:12px; color:#64748B; line-height:1.5;">
                                This is an automated security notification. For your protection, it was triggered by our session integrity monitoring.
                            </p>
                        </td>
                    </tr>

                    <!-- App Sub-Footer -->
                    <tr>
                        <td align="center" style="background-color:#F8FAFC; padding:24px 40px; border-top:1px solid #E2E8F0; font-size:12px; color:#94A3B8;">
                            © ${new Date().getFullYear()} PakTrack Traveling Network. All rights reserved.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
};
