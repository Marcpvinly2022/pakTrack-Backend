// Client-facing email: sent when a client's assigned desk agent (consultant)
// changes — either a manual admin reassignment or an agent deactivation.
// NOTE: the notification worker sends to payload.email, so callers MUST include it.
export const clientReassignedTemplate = ({
  agencyName,
  clientName,
  deskAgent,
  loginUrl,
}) => {
  const agency = agencyName || "your agency";
  const consultant = deskAgent || "your new consultant";
  const portal = loginUrl || "#";
  const name = clientName || "there";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your consultant has been updated</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background-color:#111827;padding:28px 40px;">
              <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">${agency}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.6px;text-transform:uppercase;color:#6366f1;">Account update</p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">You have a new consultant</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#4b5563;">
                Hi ${name},<br />
                We're writing to let you know that your point of contact at ${agency} has changed.
                Your applications, documents, and progress remain exactly where they were &mdash; only the person looking after your case is new.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eef0f2;border-radius:10px;background-color:#fafbfc;margin:0 0 28px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;color:#9ca3af;">Your consultant</p>
                    <p style="margin:0;font-size:16px;font-weight:600;color:#111827;">${consultant}</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <a href="${portal}" target="_blank" style="display:inline-block;width:100%;box-sizing:border-box;text-align:center;background-color:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 24px;border-radius:8px;">
                      Open your client portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #eef0f2;background-color:#fafbfc;">
              <p style="margin:0;font-size:12px;line-height:18px;color:#9ca3af;">
                You're receiving this because you have an account with ${agency}. If anything looks wrong, just reply to this email and your team will help.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
