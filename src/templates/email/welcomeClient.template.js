export const welcomeClientTemplate = ({
  agencyName,
  clientName,
  deskAgent,
  serviceName,
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
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; width: 100% !important;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fafafa; padding: 50px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.02); border: 1px solid #f0f0f0;" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Content Body -->
          <tr>
            <td style="padding: 44px 40px 32px 40px;">
              
              <!-- Subtle Brand Label & Greeting -->
              <span style="color: #6366f1; background-color: #e0e7ff; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; display: inline-block; margin-bottom: 24px;">
                Client Onboarding
              </span>
              
              <h1 style="color: #111827; font-size: 26px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.5px; line-height: 32px;">
                Welcome to ${agencyName}
              </h1>
              
              <p style="font-size: 15px; line-height: 24px; color: #4b5563; margin-top: 0; margin-bottom: 32px;">
                Hello <strong>${clientName}</strong>,<br />
                Your service portal profile has been successfully provisioned. We are preparing your case files and have created your official portal timeline access below.
              </p>

              <!-- Assignment Grid Context Split -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 28px; border-bottom: 1px solid #f3f4f6; padding-bottom: 20px;">
                <tr>
                  <td width="50%" valign="top" style="padding-right: 10px;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Assigned Consultant</span>
                    <span style="font-size: 14px; color: #1f2937; font-weight: 600;">${deskAgent}</span>
                  </td>
                  <td width="50%" valign="top" style="padding-left: 10px;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Requested Service</span>
                    <span style="font-size: 14px; color: #1f2937; font-weight: 600;">${serviceName}</span>
                  </td>
                </tr>
              </table>

              <!-- Premium Clean Credentials Block -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fafafa; border-radius: 12px; margin-bottom: 32px; border: 1px solid #f3f4f6;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-bottom: 14px; border-bottom: 1px solid #f3f4f6;">
                          <span style="font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Access Email</span>
                          <span style="font-size: 14px; color: #111827; font-weight: 500; font-family: monospace;">${email}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 14px;">
                          <span style="font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Temporary Access Key</span>
                          <code style="font-family: Menlo, Monaco, Consolas, 'Courier New', monospace; font-size: 15px; color: #111827; font-weight: 700; background-color: #f1f5f9; padding: 3px 8px; border-radius: 4px; display: inline-block; border: 1px solid #e2e8f0;">${temporaryPassword}</code>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Modern Call to Action Center Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td>
                    <a href="${loginUrl}" target="_blank" style="background-color: #111827; color: #ffffff; padding: 14px 28px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block; text-align: center; width: 100%; box-sizing: border-box; transition: background-color 0.2s ease;">
                      Launch Client Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Context Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fff8f1; border-radius: 8px; border: 1px solid #feebc8;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <p style="font-size: 12px; line-height: 18px; color: #c05621; margin: 0; font-weight: 500;">
                      <strong>Next Step Required:</strong> For data confidentiality protection, you are required to change this system-assigned temporary access key immediately during your initial portal launch verification.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="background-color: #fafafa; padding: 32px 40px; border-top: 1px solid #f3f4f6; text-align: center;">
              <p style="font-size: 13px; color: #4b5563; margin: 0 0 8px 0; font-weight: 500;">
                Thank you for choosing ${agencyName}.
              </p>
              <p style="font-size: 11px; color: #9ca3af; margin: 0; line-height: 16px;">
                Securely handled by PakTrack Notification Pipeline.<br />
                This is a secure system authentication link. Do not forward this email.
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
