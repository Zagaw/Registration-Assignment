import { uploadFileToCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.js";
import fs from "fs";

export const registerController = async (req, res) => {
    const {username, email, password} = req.body;

    if( [username, email, password].some((field) => field?.trim() === "")) {
        return res.status(400).json({message: "All fields are required."});
    }

    const profile_photo_path = req.files.profile_photo[0].path;
    const cover_photo_path = req.files.cover_photo[0].path;

    try {
        const existingUser = await User.findOne({
            $or: [{username}, {email}],
        });

        if(existingUser) {
            res.status(409).json({message: "Email or Username is already exists."});
            throw new Error("Email or Username is already exists.");
        }

        let profile_photo = "";
        let cover_photo = "";

        if(profile_photo_path && cover_photo_path){
            profile_photo = await uploadFileToCloudinary(profile_photo_path);
            cover_photo = await uploadFileToCloudinary(cover_photo_path);
        }

        const user = await User.create({
            email,
            username: username.toLowerCase(),
            password,
            profile_photo,
            cover_photo,
        });

        const createUser = await User.findById(user._id).select(
            "-password -refreshToken" 
        );

        if(!createUser) {
            return res.status(500).json({message: "Something went wrong in registration new user."});
        }

        return res.status(200).json({ userInfo: createUser, message: "Registration is success." });

    } catch (error) {
        console.log(error);
        fs.unlinkSync(profile_photo);
        fs.unlinkSync(cover_photo);
    }
};