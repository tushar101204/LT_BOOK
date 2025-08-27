module.exports = function verifyEmailTemplate(resetLink, userFind) {
  return `
    <head>
    <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
    <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">
    <style>
      a,
      a:link,
      a:visited {
        text-decoration: none;
        color: #00788a;
      }
    
      a:hover {
        text-decoration: underline;
      }
    
      h2,
      h2 a,
      h2 a:visited,
      h3,
      h3 a,
      h3 a:visited,
      h4,
      h5,
      h6,
      .t_cht {
        color: #000 !important;
      }
    
      .ExternalClass p,
      .ExternalClass span,
      .ExternalClass font,
      .ExternalClass td {
        line-height: 100%;
      }
    
      .ExternalClass {
        width: 100%;
      }
    </style>
    </head>
    
    <body style="font-size: 1.25rem;font-family: 'Roboto', sans-serif;padding-left:20px;padding-right:20px;padding-top:20px;padding-bottom:20px; background-color: #FAFAFA; width: 75%; max-width: 1280px; min-width: 600px; margin-right: auto; margin-left: auto">
    <table cellpadding="12" cellspacing="0" width="100%" bgcolor="#FAFAFA" style="border-collapse: collapse;margin: auto">
    
      <tbody>
      <tr>
        <td style="padding: 50px; background-color: #fff; max-width: 660px">
          <table width="100%" style="">
            <tr>
              <td style="text-align:center">
                <h1 style="font-size: 30px; color: #202225; margin-top: 0;">Hello Admin</h1>
                <p style="font-size: 18px; margin-bottom: 30px; color: #202225; max-width: 60ch; margin-left: auto; margin-right: auto">A new user has registered on our platform. Please review the user's details provided below and click the button below to verify the user.</p>
                 <h1 style="font-size: 25px;text-align: left; color: #202225; margin-top: 0;">User Details</h1>
                <div style="text-align: justify; margin:20px; display: flex;">
                  
                  <div style="flex: 1; margin-right: 20px;">
                    <h1 style="font-size: 20px; color: #202225; margin-top: 0;">Full Name :</h1>
                    <h1 style="font-size: 20px; color: #202225; margin-top: 0;">Email :</h1>
                    
                  </div>
                  <div style="flex: 1;">
                    <h1 style="font-size: 20px; color: #202225; margin-top: 0;">${userFind.name}</h1>
                    <h1 style="font-size: 20px; color: #202225; margin-top: 0;">${userFind.email}</h1>
                    
                  
                  </div>
                </div>
                
                <a href="http://${resetLink}" style="background-color: #4f46e5; color: #fff; padding: 8px 24px; border-radius: 8px; border-style: solid; border-color: #4f46e5; font-size: 14px; text-decoration: none; cursor: pointer">Verify User</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </tbody>
    
    </table>
    </body>
  `;
}


