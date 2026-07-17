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
<title>Welcome to ${agencyName}</title>
</head>

<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:30px;">

<div style="max-width:650px;margin:auto;background:#fff;padding:40px;border-radius:8px;">

<h2>Welcome to ${agencyName}</h2>

<p>Hello <strong>${staffName}</strong>,</p>

<p>Your staff account has been created successfully.</p>

<hr>

<p><strong>Email</strong></p>
<p>${email}</p>

<p><strong>Temporary Password</strong></p>
<p>${temporaryPassword}</p>

<hr>

<p>Please login using the link below.</p>

<p>
<a href="${loginUrl}">
Login to Dashboard
</a>
</p>

<p>For security, change your password immediately after your first login.</p>

<br>

<p>PakTrack Notification Service</p>

</div>

</body>
</html>
`;
};