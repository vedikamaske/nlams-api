import { Router } from "express";
import { adminController } from "../controllers/adminController.js";
import { supabaseAuthMiddleware } from "../../../middlewares/supabaseAuthMiddleware.js";

const router = Router();

// All admin routes require authentication
// User Management
router.get("/users", supabaseAuthMiddleware, adminController.listUsers);
router.post("/users", supabaseAuthMiddleware, adminController.createUser);
router.patch("/users/:userId/status", supabaseAuthMiddleware, adminController.updateUserStatus);
router.post("/users/:userId/roles", supabaseAuthMiddleware, adminController.assignRole);

// Reference data
router.get("/roles", supabaseAuthMiddleware, adminController.listRoles);
router.get("/organizations", supabaseAuthMiddleware, adminController.listOrganizations);

// Access Requests (public submit, protected review)
router.post("/access-requests", adminController.submitAccessRequest);  // Public: no auth needed
router.get("/access-requests", supabaseAuthMiddleware, adminController.listAccessRequests);
router.patch("/access-requests/:requestId/review", supabaseAuthMiddleware, adminController.reviewAccessRequest);

export default router;
