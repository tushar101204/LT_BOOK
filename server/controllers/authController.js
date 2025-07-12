const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../model/userSchema");
const nodemailer = require("nodemailer")
const jwt = require("jsonwebtoken");
const { reset } = require("nodemon");




const register = async (req, res, next) => {
  try {
    const { name, userType, adminKey, password, cpassword,email } = req.body;
    
    const hodExist = await User.findOne({userType: "hod" });

    if (userType === "admin") {
      if (!name || !adminKey  || !userType || !password || !cpassword) {
        return res.status(422).json({ error: "Kindly complete all fields." });
      }
    } else if (userType === "director") {
      if (!name  || !userType || !password || !cpassword) {
        return res.status(422).json({ error: "Kindly complete all fields." });
      } else if (hodExist) {
        return res.status(422).json({ error: `Hod for ${department} already exists` });
      }
    } else if (userType === "hod") {
      if (!name  || !userType || !password || !cpassword) {
        return res.status(422).json({ error: "Kindly complete all fields." });
      } else if (hodExist) {
        return res.status(422).json({ error: `Hod for ${department} already exists` });
      }
    } else {
      if (!name  || !userType || !password || !cpassword) {
        return res.status(422).json({ error: "Kindly complete all fields." });
      }
    }

    // Regular expression to validate full name with at least two words separated by a space
    const nameRegex = /^[\w'.]+\s[\w'.]+\s*[\w'.]*\s*[\w'.]*\s*[\w'.]*\s*[\w'.]*$/;
  
    if (!nameRegex.test(name)) {
      return res.status(422).json({ error: "Kindly provide your complete name." });
    }


    // Password length validation
    if (password.length < 7) {
      return res.status(422).json({ error: "Password must contain at least 7 characters." });
    }

    if (password !== cpassword) {
      return res.status(422).json({ error: "Password and confirm password do not match." });
    }

    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(422).json({ error: "Provided email id is associated with another account." });
    } else {
      let user;
      if (userType === "admin") {
        user = new User({ name, userType, adminKey, password, cpassword,email });
      } else if (userType === "director") {
        user = new User({ name, userType: "faculty", password, cpassword,email });
      } else {
        user = new User({ name, userType, adminKey: "null", password, cpassword,email });
      }

      // Perform additional validation or data processing here
      await user.save();
      return res.status(201).json({ message: "Saved successfully" });
    }
  } catch (error) {
    next(error);
  }
};




  // transporter for sending email
  const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
      user:process.env.SENDER_EMAIL,
      pass:process.env.SENDER_PASSWORD
    }
  })


  

  const resetPasswordTemplate = (resetLink, userName) => {
    console.log("Reset Link ", resetLink);
    const url=resetLink;
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
  };
  
  
  
  



   






  
  const verifyEmailTemplate = (resetLink,userFind) => {
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
  };

const passwordLink = async (req, res,next) => {
  // console.log(req.body);
  // res.json({message:"login success"})
  try {

    const { email } = req.body;
    if (!email ) {
      return res.status(400).json({ error: "Please Enter yout Email" });
    }

    const userFind = await User.findOne({ email });

    if (userFind) {
        const token = jwt.sign({_id:userFind._id},process.env.SECRET_KEY,{
          expiresIn:"300s"
        })
        
        const setUserToken = await User.findByIdAndUpdate({_id:userFind._id},{verifyToken:token},{new:true})
        

        if (setUserToken) {
          const mailOptions = {
            from:process.env.SENDER_EMAIL,
            to:email,
            subject:"Book It Reset Password",
            html:resetPasswordTemplate((`${process.env.CLIENT_URL}/forgotPassword/${userFind.id}/${setUserToken.verifyToken}`),userFind.name)
            // text:`This link is valid for 5 minutes \n ${process.env.CLIENT_URL}/forgotPassword/${userFind.id}/${setUserToken.verifyToken} \n click on above link`
          }
          console.log(`${process.env.CLIENT_URL}/forgotPassword/${userFind.id}/${setUserToken.verifyToken}`)
        
          transporter.sendMail(mailOptions,(error,info)=>
          {
            if (error) {
              console.log(error);
              res.status(401).json({status:401,message:"Email not Send"})
            }else{
              console.log("Email Sent ",info.response);
              res.status(201).json({status:201,message:"Email Send Successfully"})
            }
          })
        }



        // console.log(setUserToken);

    } else {
      res.status(400).json({ error: "Invalid Credentials" });
    }
  } catch (error) {
    res.status(401).json({status:401,message:"Invalid User"})
      next(error);
  }
}



const forgotPassword = async (req, res,next) => {
  const {id,token} = req.params
  try {
    const validUser = await User.findOne({_id:id,verifyToken:token})

      const verifyToken = jwt.verify(token,process.env.SECRET_KEY);

      if (validUser && verifyToken._id) {
        res.status(201).json({status:201,validUser})
      }else{
        res.status(401).json({status:401,message:"user not exist"})
      }

  //  // console.log(validUser); 
  } catch (error) {
    res.status(401).json({status:401,error})
    
  }
   
  
}


const setNewPassword = async (req, res,next) => {
  const {id,token} = req.params
  const {password,cpassword} = req.body
  
  try {
    if (password.length < 7) {
      return res.status(422).json({ error: "Password must contain at least 7 characters" });
    }
  
    if (password !== cpassword) {
      return res.status(422).json({ error: "Password and confirm password do not match" });
    }

    const validUser = await User.findOne({_id:id,verifyToken:token})

      const verifyToken = jwt.verify(token,process.env.SECRET_KEY);

      if (validUser && verifyToken._id) {

        
        const newPassword =await  bcrypt.hash(password,12)
        const setnewPassword = await User.findByIdAndUpdate({_id:id},{password:newPassword})

        setnewPassword.save()

        res.status(201).json({status:201,setnewPassword})
      }else{
        res.status(401).json({status:401,message:"user not exist"})
      }

  //  // console.log(validUser); 
  } catch (error) {
    res.status(401).json({status:401,error})
    
  }
   
  
}











const emailVerificationLink = async (req, res,next) => {
  // console.log(req.body);
  // res.json({message:"login success"})
  try {

    const { email } = req.body;

    if (!email ) {
      return res.status(400).json({ error: "Please Enter yout Email" });
    }

    const userFind = await User.findOne({ email });

    if (userFind) {
        const token = jwt.sign({_id:userFind._id},process.env.SECRET_KEY,{
          expiresIn:"1d"
        })
        
        const setUserToken = await User.findByIdAndUpdate({_id:userFind._id},{verifyToken:token},{new:true})
        

        if (setUserToken) {
          const resetLink=`${process.env.CLIENT_URL}/verifyEmail/${userFind.id}/${setUserToken.verifyToken}`;
          console.log(resetLink);
          const mailOptions = {
            from:process.env.SENDER_EMAIL,
            // to:email,
            //send mail to admin to verify new user
            to:process.env.ADMIN_MAIN,
            subject:" User Verification",
            html:verifyEmailTemplate(resetLink,userFind)
            // text:`This link is valid for 5 minutes \n ${process.env.CLIENT_URL}/forgotPassword/${userFind.id}/${setUserToken.verifyToken} \n click on above link`
          }
        
          transporter.sendMail(mailOptions,(error,info)=>
          {
            if (error) {
              // console.log(error);
              res.status(401).json({status:401,message:"Email not Send"})
            }else{
              // console.log("Email Sent ",info.response);
              res.status(201).json({status:201,message:"Email Send Successfully"})
            }
          })
        }



        // console.log(setUserToken);

    } else {
      res.status(400).json({ error: "Invalid Credentials" });
    }
  } catch (error) {
    res.status(401).json({status:401,message:"Invalid User"})
      next(error);
  }
}





const verifyEmail = async (req, res,next) => {
  const {id,token} = req.params;
  console.log(id);
  console.log(token);
  try {
      
    const validUser = await User.findOne({_id:id})
    console.log("User Fetched ",validUser);
    const verifyToken =await jwt.verify(token,process.env.SECRET_KEY);

    console.log(verifyToken);



      if (validUser && verifyToken._id) {
        const setUserToken = await User.findByIdAndUpdate({_id:validUser._id},{emailVerified:true})
        setUserToken.save()
        res.status(201).json({status:201,validUser,message:"Verify successfully"})
      }
      else{
        res.status(401).json({status:401,error:"user not exist"})
      }
      // console.log(setUserToken);
    
     
  //  // console.log(validUser); 
  } catch (error) {
    // res.status(401).json({status:422,error})
    next(error);

  }
}







const login = async (req, res, next) => {
    // console.log(req.body);
    
    // res.json({message:"login success"})
    try {
      let token;
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Kindly complete all fields." });
      }
  
      const userLogin = await User.findOne({ email });
  
      if (userLogin) {
        const isMatch = await bcrypt.compare(password, userLogin.password);
        console.log(isMatch);
        token = await userLogin.generateAuthToken();
        //console.log("this is login token" + token);

        res.cookie("jwtoken", token, {
          maxAge: 900000,
          // expires: new Date(Date.now() + 9000000),
          path :"/",
          
          // domain:".onrender.com",
          // expires: new Date(Date.now() + 900),
          
          httpOnly: true,
        })

        // window.sessionStorage.setItem("jwtoken", data.token);
       
        if (!isMatch) {
          res.status(400).json({ error: "Invalid Credentials" });
        } else {
          req.rootUser=userLogin;
          res.status(200).json({ userLogin, token: token, message: "User logged in successfully" });
          // res.status(200)
          // .send(userLogin).json({ message: "user login successfully" })
        }
      } else {
        res.status(400).json({ error: "Invalid12 Credentials" });
      }
      
    } catch (error) {
        next(error);
    }
  }





  const about = async (req, res) => {
    // console.log("about page");
    res.send(req.rootUser);
  }
  
  //get user data for contact us and home page
  const getdata = async (req, res) => {
     //console.log("getdata page");
    //console.log(req.rootUser);
    res.send(req.rootUser);
  }





  const updateProfile = async (req, res) => {
    try {
      const userId = req.rootUser._id;  // Get the user's ID from the request
      console.log(userId);
      const { name , facultyType, phone} = req.body;  // Extract the fields to be updated
  

      if (!name  || !phone ) {
        return res.status(422).json({ error: "Kindly fill all fields." });
      }
       // Regular expression to validate full name with at least two words separated by a space
    const nameRegex = /^[\w'.]+\s[\w'.]+\s*[\w'.]*\s*[\w'.]*\s*[\w'.]*\s*[\w'.]*$/;
  
    if (!nameRegex.test(name)) {
      return res.status(422).json({ error: "Kindly provide your complete name." });
    }
   
    // Phone validation
  

    if (!/^\d{10}$/.test(phone)) {
      return res.status(422).json({ error: "Kindly enter a valid 10-digit phone number." });
    }
  
      // Validate input data if necessary (e.g., check phone number format)
  
      // Update the user data in the database
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { name , facultyType, phone},
        { new: true }
      );
  
      // Send the updated user data to the frontend
      res.status(200).send(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).send({ message: "Error updating profile." });
    }
  };
  


  const contact = async (req, res,next) => {
    try {
      const { name, email,department, phone, message } = req.body;
  
      if (!name || !department || !email || !phone || !message) {
        // console.log("error in contact form");
        return res.json({ error: "Plz fill form correctly" });
      }
  
  const userContact = await  User.findOne({_id:req.userID})
  
  if (userContact){
    // console.log("user find");
  
    const userMessage = await userContact.addMessage(name,email,phone,message)
    await userContact.save();
  
    res.status(201).json({message:"message created"})
  
  }
  
    } catch (error) {
        next(error);
    }
  }
  
  

  
  const logout = async (req, res, next) => {
    // const userId = req.userId; // get the userId from the request header
    try {
      const userId = req.params.userId;
      // remove the user token from the database
      const user = await User.findByIdAndUpdate(
        {_id: userId},
        { $unset: { tokens: 1 } },
        { new: true }
      );
  
      // clear the cookie
      // res.clearCookie("jwtoken",{path:"/"});

  
      res.status(200).send("User logged out successfully");
    } catch (error) {
      next(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  const deleteFaculty = async (req, res) => {
    try {
      console.log("Inside Delete Faculty");
      const { userID } = req.params;
      const faculty = await User.findByIdAndDelete(userID);
  
      if (!faculty) {
        return res.status(404).json({
          success: false,
          message: "Instructor not found",
        });
      }
  
      console.log("Instructor deleted successfully");
      return res.status(200).json({
        success: true,
        message: "Instructor deleted successfully",
      });
    } catch (err) {
      console.error("Error in deleteFaculty:", err.message);
      return res.status(500).json({
        success: false,
        message: "Error deleting user data",
      });
    }
  };
  
  const getallInstructor = async (req, res) => {
    try {
      console.log("Inside getallInstructor");
  
      // Exclude the current user and any user with userType 'admin'
      const faculties = await User.find({
      
        userType: { $ne: "admin" },
      });
  
      if (faculties.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No instructors found",
        });
      }
  
      console.log("Fetched all instructors successfully");
      return res.status(200).json({
        success: true,
        message: "All users fetched",
        faculties,
      });
    } catch (err) {
      console.error("Error in getallInstructor:", err.message);
      return res.status(500).json({
        success: false,
        message: "Error fetching user data",
      });
    }
  };
  
  
  
module.exports = { register, login, about, getdata,updateProfile, contact ,logout,passwordLink,forgotPassword,setNewPassword,emailVerificationLink,verifyEmail,deleteFaculty,getallInstructor};
