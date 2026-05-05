import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// --------------------------------------------
// @desc    Register New User
// @route   POST /api/v1/users/register
// @access  Public
// --------------------------------------------
const registeruser = asyncHandler(async (req, res) => {

    // --------------------------------------------
    // Step 1: Get Text Data from frontend
    // --------------------------------------------
    const { fullname, username, email, password } = req.body;

    // --------------------------------------------
    // Step 2: Validate Required Fields
    // --------------------------------------------
    if (
        [fullname, username, email, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // --------------------------------------------
    // Step 3: Get Uploaded Files from multer
    // avatar required
    // coverImage optional
    // --------------------------------------------
   
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }

    // --------------------------------------------
    // Step 4: Check if user already exists
    // --------------------------------------------
    const existedUser = await User.findOne({
        $or: [
            { username: username.toLowerCase() },
            { email: email.toLowerCase() }
        ]
    });

    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }

    // --------------------------------------------
    // Step 5: Upload Avatar to Cloudinary
    // --------------------------------------------
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar) {
        throw new ApiError(500, "Avatar upload failed");
    }

    // --------------------------------------------
    // Step 6: Upload Cover Image (Optional)
    // --------------------------------------------
    let coverImage = "";

    if (coverImageLocalPath) {
        const uploadedCover = await uploadOnCloudinary(coverImageLocalPath);
        coverImage = uploadedCover?.url || "";
    }

    // --------------------------------------------
    // Step 7: Create User in DB
    // --------------------------------------------
    const user = await User.create({
        fullname,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage
    });

    // --------------------------------------------
    // Step 8: Remove Password
    // --------------------------------------------
    const createdUser = await User.findById(user._id).select("-password");

    if (!createdUser) {
        throw new ApiError(500, "User registration failed");
    }

    // --------------------------------------------
    // Step 9: Final Response
    // --------------------------------------------
    return res.status(201).json(
        new ApiResponse(
            201,
            createdUser,
            "User registered successfully"
        )
    );
});

const loginuser = asyncHandler(async (req, res) => {

    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    const user = await User.findOne({
        $or: [
            { username: username?.toLowerCase() },
            { email: email?.toLowerCase() }
        ]
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: false // production me true
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "Login successful"
            )
        );
});


export { registeruser, loginuser };