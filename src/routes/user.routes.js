import { Router } from "express";

const router = Router();

import { registeruser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
// import { verifyJWT } from "../middlewares/auth.middleware.js";
// router.post("/register", registeruser);

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registeruser
    )


export default router;