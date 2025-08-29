const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
    try{
            let transporter = nodemailer.createTransport({
                host: process.env.SENDER_HOST,
                auth:{
                    user: process.env.SENDER_EMAIL,
                    pass: process.env.SENDER_PASSWORD,
                }
            })


            let info = await transporter.sendMail({
                from: 'StudyNotion || CodeHelp - by Babbar',
                to: `${email}`,
                subject: `${title}`,
                html: `${body}`,
            })
            console.log(info);
            return info;
    }
    catch(error) {
        console.log(error.message);
    }
}


module.exports = mailSender;


