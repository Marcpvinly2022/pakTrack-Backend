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
<title>Welcome to ${agencyName}</title>
</head>

<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:30px;">

<div style="max-width:650px;margin:auto;background:#fff;padding:40px;border-radius:8px;">

<h2>Welcome to ${agencyName}</h2>

<p>Hello <strong>${clientName}</strong>,</p>

<p>Your application has been created successfully.</p>

<hr>

<p><strong>Assigned Consultant</strong></p>
<p>${deskAgent}</p>

<p><strong>Service</strong></p>
<p>${serviceName}</p>

<p><strong>Email</strong></p>
<p>${email}</p>

<p><strong>Temporary Password</strong></p>
<p>${temporaryPassword}</p>

<hr>

<p>You can now access your client portal using the link below.</p>

<p>
<a href="${loginUrl}">
Login to Client Portal
</a>
</p>

<p>Please change your password after your first login.</p>

<br>

<p>Thank you for choosing ${agencyName}.</p>

<p>PakTrack Notification Service</p>

</div>

</body>
</html>
`;
};