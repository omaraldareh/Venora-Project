const User = require('../models/User.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendOtpMail = require('../utils/SendMail');
const OTP = require('../utils/generateOTP');
const redisClient = require('../redisClient');

const register = async (req, res) => {

   const { name, email, password, confirmPassword, phone, address , role} = req.body;

   if (!name || !email || !password || !confirmPassword || !phone || !address || !role) {
      return res.status(400).json({
         message: "All fields are required"
      });
   }

   try {

      const emailExist = await User.findOne({ email });

      if (emailExist) {
         return res.status(409).json({
            message: "Email already exist"
         });
      }

      if (password !== confirmPassword) {
         return res.status(400).json({
            message: "Passwords do not match"
         });
      }

      const allowedRoles = ["user", "provider"];

      if (!allowedRoles.includes(role)) {
         return res.status(400).json({
            message: "Invalid role"
         });
      }

      const hashedPassword = await bcrypt.hash(
         password,
         Number(process.env.SALT)
      );

      const otp = OTP();
      const userData = {
         name,
         email,
         password: hashedPassword,
         phone,
         address,
         role
      };

      await redisClient.set(
         `otp:${email}`,
         JSON.stringify({ otp, userData }),
         { EX: 300 }
      );

      await sendOtpMail(email, otp, "register");

      return res.status(200).json({
         message: "OTP sent successfully"
      });

   } catch (error) {
      return res.status(500).json({
         message: error.message
      });
   }
};

const verifyRegisterOtp = async (req, res) => {
   const { email, otp } = req.body;

   try {
      if (!email || !otp) {
         return res.status(400).json({
            message: "Email and OTP are required"
         });
      }

      const data = await redisClient.get(`otp:${email}`);

      if(!data){
            return res.status(400).json({ message: 'OTP expired or not found' });
        }

        const parsedData = JSON.parse(data);

        if (String(parsedData.otp) !== String(otp)) {
            return res.status(400).json({
               message: "Invalid OTP"
            });
         }

         const userExists = await User.findOne({
            email: parsedData.userData.email
            });

            if (userExists) {
            return res.status(409).json({
               message: "User already exists"
            });
            }

        const newUser = new User ({
            name : parsedData.userData.name,
            email : parsedData.userData.email,
            password : parsedData.userData.password,
            phone : parsedData.userData.phone,
            address : parsedData.userData.address,
            role : parsedData.userData.role
        })

        await newUser.save();
        await redisClient.del(`otp:${email}`);

        return res.status(200).json({
            message: "User registered successfully",
            data: {
                id : newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        });
    }    
    catch (error) {
      return res.status(500).json({
         message: error.message
      });
   }

}
const resendOtp = async (req, res) => {

   const { email, type } = req.body;

   try {

      if (!email) {
         return res.status(400).json({
            message: "Email is required"
         });
      }

      const redisKey =
         type === "reset"
            ? `resetOtp:${email}`
            : `otp:${email}`;

      const data = await redisClient.get(redisKey);

      if (!data) {
         return res.status(400).json({
            message: "OTP expired or not found"
         });
      }

      const parsedData = JSON.parse(data);

      const newOtp = OTP();

      await redisClient.set(
         redisKey,
         JSON.stringify({
            otp: newOtp,
            userData: parsedData.userData || null
         }),
         { EX: 300 }
      );

      await sendOtpMail(email, newOtp, type);

      return res.status(200).json({
         message: "OTP resent successfully"
      });

   } catch (error) {

      return res.status(500).json({
         message: error.message
      });
   }
};
const Login = async (req, res) => {

   const { email, password } = req.body;

   try {

      if (!email || !password) {
         return res.status(400).json({
            message: "Email and Password are required"
         });
      }

      const user = await User.findOne({ email });

      if (!user) {
         return res.status(401).json({
            message: "Invalid email or password"
         });
      }

      const isMatch = await bcrypt.compare(password,user.password);

      if (!isMatch) {
         return res.status(401).json({
            message: "Invalid email or password"
         });
      }

      const token = jwt.sign(
         {
            id: user._id,
            role: user.role
         },
         process.env.SECRET_KEY,
         {
            expiresIn: "7d"
         }
      );

      return res.status(200).json({
         message: "User logged in successfully",
         token,
         data: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
         }
      });

   } catch (error) {
      return res.status(500).json({
         message: error.message
      });
   }

};

const forgetPassword = async (req, res) => {

   const { email } = req.body;

   try {

      if (!email) {
         return res.status(400).json({
            message: "Email is required"
         });
      }

      const user = await User.findOne({ email });

      if (!user) {
         return res.status(404).json({
            message: "User not found"
         });
      }

      const otp = OTP();

      await redisClient.set(
         `resetOtp:${email}`,
         JSON.stringify({ otp }),
         { EX: 300 }
      );

      await sendOtpMail(email, otp, "reset");
      return res.status(200).json({
         message: "OTP sent successfully"
      });

   } catch (error) {
      return res.status(500).json({
         message: error.message
      });
   }
}

const verifyResetOtp = async (req, res) => {

   const { email, otp } = req.body;

   try {

      if (!email || !otp) {
         return res.status(400).json({
            message: "Email and OTP are required"
         });
      }

      const data = await redisClient.get(
         `resetOtp:${email}`
      );

      if (!data) {
         return res.status(400).json({
            message: "OTP expired or not found"
         });
      }

      const parsedData = JSON.parse(data);

      if (String(parsedData.otp) !== String(otp)) {
         return res.status(400).json({
            message: "Invalid OTP"
         });
      }

      await redisClient.set(
         `resetVerified:${email}`,
         "true",
         { EX: 300 }
      );

      return res.status(200).json({
         message: "OTP verified successfully"
      });

   } catch (error) {

      return res.status(500).json({
         message: error.message
      });

   }
}

const resetPassword = async (req, res) => {

   const { email, password, confirmPassword } = req.body;

   try {

      if (!email || !password || !confirmPassword) {
         return res.status(400).json({
            message: "All fields are required"
         });
      }

      const user = await User.findOne({ email });

      if (!user) {
         return res.status(404).json({
            message: "User not found"
         });
      }

      const isVerified = await redisClient.get(
         `resetVerified:${email}`
      );

      if (!isVerified) {
         return res.status(401).json({
            message: "OTP verification required"
         });
      }

      if (password !== confirmPassword) {
         return res.status(400).json({
            message: "Passwords do not match"
         });
      }

      const hashedPassword = await bcrypt.hash(
         password,
         Number(process.env.SALT)
      );

      await User.findOneAndUpdate(
         { email },
         {
            password: hashedPassword
         }
      );

      await redisClient.del(`resetOtp:${email}`);
      await redisClient.del(`resetVerified:${email}`);

      return res.status(200).json({
         message: "Password reset successfully"
      });

   } catch (error) {
      return res.status(500).json({
         message: error.message
      });
   }
}
const Logout = async (req, res) => {
   return res.status(200).json({
      message: "User logged out successfully"
   });
}


module.exports = {
   register,
   verifyRegisterOtp,
   resendOtp,
   Login,
   forgetPassword,
   verifyResetOtp,
   resetPassword,
   Logout
};