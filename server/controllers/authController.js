const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../model/userSchema");
const nodemailer = require("nodemailer")
const mailSender = require("../utills/mailSender");
const resetPasswordTemplate = require("../template/resetPasswordTemplate");
const verifyEmailTemplate = require("../template/verifyEmailTemplate");
const jwt = require("jsonwebtoken");
const { reset } = require("nodemon");



const register = async (req, res, next) => {
  try {
    console.log("register karne aa gye")
    const { name, userType, adminKey, password, cpassword,email } = req.body;
    console.log(name,userType,adminKey,password,cpassword,email)
    const allowedRoles = ["student","faculty","admin"];
    if (!name  || !userType || !password || !cpassword || !email) {
      return res.status(422).json({ error: "Kindly complete all fields." });
    }
    if (!allowedRoles.includes(String(userType).toLowerCase())) {
      return res.status(422).json({ error: "Invalid user type. Allowed: student, faculty, admin" });
    }
    if (String(userType).toLowerCase() === "admin" && !adminKey) {
      return res.status(422).json({ error: "Admin key is required for admin registration" });
    }

    // Regular expression to validate full name with at least two words separated by a space
    const nameRegex = /^[\w'.]+\s[\w'.]+\s*[\w'.]*\s*[\w'.]*\s*[\w'.]*\s*[\w'.]*$/;
    console.log(nameRegex);
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
      const normalizedRole = String(userType).toLowerCase();
      const user = new User({ name, userType: normalizedRole, adminKey: normalizedRole === "admin" ? adminKey : "null", password, cpassword,email });

      // Perform additional validation or data processing here
      await user.save();
      return res.status(201).json({ message: "Saved successfully" });
    }
  } catch (error) {
    next(error);
  }
};

  // transporter for sending email
  // const transporter = nodemailer.createTransport({
  //   service:"gmail",
  //   auth:{
  //     user:process.env.SENDER_EMAIL,
  //     pass:process.env.SENDER_PASSWORD
  //   }
  // })

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
          const html = resetPasswordTemplate((`${process.env.CLIENT_URL}/forgotPassword/${userFind.id}/${setUserToken.verifyToken}`),userFind.name)
          await mailSender(email, "Book It Reset Password", html)
          res.status(201).json({status:201,message:"Email Send Successfully"})
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
  console.log(req.body);
  // res.json({message:"login success"})
  try {

    const { email } = req.body;
    console.log("email",email)
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
          const html = verifyEmailTemplate(resetLink,userFind)
          await mailSender(process.env.ADMIN_MAIN, "User Verification", html)
          res.status(201).json({status:201,message:"Email Send Successfully"})
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
  console.log("ha jee")
  console.log(id);
  console.log(token);
  console.log("badhiya jee")
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
    try {
      const userId = req.user && req.user.id ? req.user.id : null;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const user = await User.findById(userId).select("-password -cpassword");
      return res.send(user);
    } catch (e) {
      return res.status(500).json({ message: "Error fetching profile" });
    }
}
  
  //get user data for contact us and home page
const getdata = async (req, res) => {
     //console.log("getdata page");
    //console.log(req.rootUser);
    try {
      const userId = req.user && req.user.id ? req.user.id : null;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const user = await User.findById(userId).select("-password -cpassword");
      return res.send(user);
    } catch (e) {
      return res.status(500).json({ message: "Error fetching data" });
    }
}



  const updateProfile = async (req, res) => {
    try {
      const userId = req.user && req.user.id ? req.user.id : null;  // Get the user's ID from the request
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
  }
  


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
