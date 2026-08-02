/**
 * --------------------------------------------------------------------------
 * PakTrack Ultra-Modern Password Reset Email Template
 * --------------------------------------------------------------------------
 */
export const passwordResetTemplate = ({ firstName, resetLink }) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta name="x-apple-disable-message-reformatting" />
    <title>Reset Your Password</title>
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
                            <h2 style="margin:0 0 16px 0; font-size:20px; font-weight:700; color:#1E293B; line-height:1.3;">
                                Reset your password
                            </h2>
                            <p style="margin:0 0 20px 0; font-size:15px; color:#475569; line-height:1.6;">
                                Hello ${firstName},
                            </p>
                            <p style="margin:0 0 28px 0; font-size:15px; color:#475569; line-height:1.6;">
                                We received a request to change the password securely connected to your PakTrack logistics profile. Click the primary button below to choose a new password configuration.
                            </p>

                            <!-- Bulletproof Call-To-Action Button -->
                            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px 0;">
                                <tr>
                                    <td align="center" bgcolor="#0F172A" style="border-radius:8px;">
                                        <a href="${resetLink}" target="_blank" style="display:inline-block; padding:14px 28px; font-size:14px; font-weight:600; color:#FFFFFF; text-decoration:none; background-color:#0F172A; border-radius:8px; border:1px solid #0F172A; -webkit-text-size-adjust:none; mso-padding-alt:0px; text-align:center;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            ${resetLink}
                            <!-- Urgent UX Expiration Callout Warning Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#EFF6FF; border-left:4px solid #2563EB; border-radius:4px; margin:0 0 24px 0;">
                                <tr>
                                    <td style="padding:14px 16px; font-size:13px; color:#1E40AF; line-height:1.5; font-weight:500;">
                                        ⏱️ For your corporate security, this generation sequence link is highly short-lived and will automatically expire in <strong>15 minutes</strong>.
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:0 0 32px 0; font-size:13px; color:#64748B; line-height:1.6;">
                                If you did not actively initiate this request, you can safely disregard this notification email. Your current credentials remain locked and fully secure.
                            </p>

                            <!-- Separation Rule -->
                            <hr style="border:0; border-top:1px solid #E2E8F0; margin:0 0 24px 0;" />

                            <!-- Defensive Fallback Link Section -->
                            <p style="margin:0 0 6px 0; font-size:12px; font-weight:600; color:#475569; text-transform:uppercase; letter-spacing:0.05em;">
                                Having trouble with the button?
                            </p>
                            <p style="margin:0; font-size:12px; color:#64748B; line-height:1.5; word-break:break-all;">
                                Copy and paste this raw destination URL directly into your secure browser window address bar: <br/>
                                <a href="${resetLink}" style="color:#2563EB; text-decoration:underline;">${resetLink}</a>
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
