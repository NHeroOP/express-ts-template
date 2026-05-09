import type { Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { Types } from "mongoose";
import { User } from "../models/User.model.js";

import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateTokens = async (userId: Types.ObjectId | string): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    console.log(err)
    throw new ApiError(500, "Error while generating tokens");
  }
}

export const registerUser = asyncHandler(async (req: Request, res: Response) => {

  const { username, email, fullName, password } = req.body;
  
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const userExists = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (userExists) {
    throw new ApiError(409, "User with the same username or email already exists");
  }


  const files = req.files as {
    avatarUrl?: Express.Multer.File[];
  };

  if (!files || !files.avatarUrl || files.avatarUrl.length === 0) {
    throw new ApiError(400, "Avatar image is required");
  }

  const avatarLocalPath = files.avatarUrl[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar) {
    throw new ApiError(500, "Error while uploading avatar");
  }

  const user = await User.create({
    fullName,
    avatarUrl: avatar.url,
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Error while creating user");
  }

  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered successfully")
  )

});


export const loginUser = asyncHandler(async (req: Request, res: Response) => {

  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  } 
  
  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  

  const isPassValid: boolean = await user.isPasswordCorrect(password);
  if (!isPassValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const userData = {
    _id: user._id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, {
        user: userData,
        accessToken,
        refreshToken
      }, "User logged in successfully")
    );
})


export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  await User.findByIdAndUpdate(userId, {
    $unset: { refreshToken: 1 }
  }, { returnDocument: "after" });  

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)  
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
})

export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is missing");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET!!) as JwtPayload;
  
    const user = await User.findById(decodedToken?._id);
  
    if (!user) {
      throw new ApiError(401, "Invalid refresh token - user not found");
    }
    
    if (user.refreshToken !== incomingRefreshToken) { 
      throw new ApiError(401, "Invalid refresh token");
    }
  
    const options = {
      httpOnly: true,
      secure: true,
    }
  
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user._id);
    
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(200, {
          accessToken,
          refreshToken: newRefreshToken,
        }, "Access token refreshed successfully"
        )
      );
  } catch (err: any) {
    throw new ApiError(401, err?.message || "Invalid refresh token");
  }
})