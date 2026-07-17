export const baseTemplate = ({
  title,
  agencyName,
  content,
}) => {
  return `
<!DOCTYPE html>
<html lang="en">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>${title}</title>

<style>
body{
    margin:0;
    padding:40px;
    background:#f4f6f9;
    font-family:Arial,Helvetica,sans-serif;
}

.container{
    max-width:700px;
    margin:auto;
    background:#ffffff;
    border-radius:10px;
    overflow:hidden;
}

.header{
    background:#0F172A;
    color:#fff;
    text-align:center;
    padding:30px;
}

.content{
    padding:40px;
    color:#374151;
    line-height:1.7;
}

.footer{
    background:#F9FAFB;
    text-align:center;
    padding:20px;
    font-size:13px;
    color:#6B7280;
}

.button{
    display:inline-block;
    margin-top:20px;
    padding:14px 28px;
    background:#2563EB;
    color:#fff !important;
    text-decoration:none;
    border-radius:6px;
}
</style>

</head>

<body>

<div class="container">

<div class="header">
<h2>${agencyName}</h2>
</div>

<div class="content">
${content}
</div>

<div class="footer">
<p>Powered by PakTrack</p>
<p>Please do not reply to this automated email.</p>
</div>

</div>

</body>

</html>
`;
};