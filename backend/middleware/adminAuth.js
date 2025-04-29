import jwt from "jsonwebtoken";

const adminAuth = async (req, res, next) => {
  const { token } = req.headers;
  if (!token) {
    return res.json({ success: false, message: "Not Authorized, Login Again" });
  }
  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    if (token_decode.role !== "admin") {
      return res.json({ success: false, message: "Access denied: Admins only" });
    }
    req.body.userId = token_decode.id;
    req.body.role = token_decode.role;
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.json({ success: false, message: "Invalid token" });
  }
};

export default adminAuth;