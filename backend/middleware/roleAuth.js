import jwt from "jsonwebtoken";

const roleAuth = (allowedRoles) => {
  return async (req, res, next) => {
    const { token } = req.headers;
    if (!token) {
      return res.json({ success: false, message: "Not Authorized, Login Again" });
    }
    try {
      const token_decode = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token role:", token_decode.role); // Debug token role
      if (!allowedRoles.includes(token_decode.role)) {
        return res.json({ success: false, message: "Access denied" });
      }
      // Only add userId to req.body, do not overwrite role
      req.body.userId = token_decode.id;
      console.log("Middleware added userId:", req.body.userId); // Debug middleware
      next();
    } catch (error) {
      console.error("Role auth error:", error);
      res.json({ success: false, message: "Invalid token" });
    }
  };
};

export const adminAndManagerAuth = roleAuth(["admin", "manager"]);
export const adminAndLogisticsAuth = roleAuth(["admin", "logistics"]);
export const adminOnlyAuth = roleAuth(["admin"]);
export const subAdminAuth = roleAuth(["admin", "manager", "logistics"]);