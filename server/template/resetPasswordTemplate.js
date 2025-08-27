module.exports = function resetPasswordTemplate(resetLink, userName) {
  const url = resetLink;
  return `
  <head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">
  <style>
    .button-link {
      display: inline-block;
      background-color: #4f46e5;
      color: #ffffff !important;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      text-align: center;
      text-decoration: none;
      margin-top: 20px;
    }
  </style>
  </head>
  
  <body style="font-family: 'Roboto', sans-serif; padding: 20px; background-color: #FAFAFA; width: 100%; max-width: 660px; margin: auto;">
    <div style="background-color: #ffffff; padding: 40px; text-align: center;">
      <h1 style="font-size: 24px; color: #202225;">Hello ${userName},</h1>
      <p style="font-size: 16px; color: #202225;">
        A request has been received to change the password for your account. Click the button below to reset your password.
      </p>
      <a href="http://${url}" class="button-link">Reset Password</a>
      <p style="font-size: 14px; color: #B6B6B6; margin-top: 30px;">
        If you didn’t request this, you can ignore this email. Your password won’t change until you create a new one.
      </p>
    </div>
  </body>
  `;
}


