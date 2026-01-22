import { Router } from "express";
import upload from "../middlewares/multer.js";
import {
  initUpload,
  uploadChunk,
  finalizeUpload
} from "../controllers/upload-controller.js";

const router = Router();


router.post("/init", initUpload);


router.post("/chunk", upload.single("file"), uploadChunk);


router.post("/finalize", finalizeUpload);



export default router;
