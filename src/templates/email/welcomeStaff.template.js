export const welcomeStaffTemplate = ({
  agencyName,
  staffName,
  email,
  temporaryPassword,
  loginUrl,
}) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to ${agencyName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; width: 100% !important;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 35px 40px; text-align: left;">
              <span style="color: #93c5fd; text-transform: uppercase; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; display: block; margin-bottom: 6px;">Onboarding</span>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Welcome to ${agencyName}</h1>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 16px; line-height: 24px; color: #334155; margin-top: 0; margin-bottom: 16px;">
                Hello <strong style="color: #0f172a;">${staffName}</strong>,
              </p>
              <p style="font-size: 15px; line-height: 24px; color: #475569; margin-bottom: 24px;">
                Your professional staff portal account has been provisioned successfully. You can now access your corporate dashboard using the credentials below.
              </p>

              <!-- Credentials Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; display: block;">Login Email</span>
                          <span style="font-size: 15px; color: #0f172a; font-weight: 500; word-break: break-all;">${email}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="border-top: 1px dashed #cbd5e1; padding-top: 12px;">
                          <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; display: block;">Temporary Password</span>
                          <code style="font-family: 'Courier New', Courier, monospace; font-size: 16px; color: #2563eb; font-weight: 700; letter-spacing: 0.5px;">${temporaryPassword}</code>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); transition: background-color 0.2s ease;">
                      Login to Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
                <tr>
                  <td>
                    <p style="font-size: 13px; line-height: 20px; color: #64748b; margin: 0;">
                      <strong style="color: #475569;">Security Action Required:</strong> For data protection compliance, you will be prompted to update this temporary password immediately upon your first initialization sequence.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0; font-weight: 500;">
                Sent via PakTrack Notification Pipeline
              </p>
              <p style="font-size: 11px; color: #cbd5e1; margin-top: 4px; margin-bottom: 0;">
                This is an automated operational transmission. Please do not reply directly to this message.
              </p>
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
