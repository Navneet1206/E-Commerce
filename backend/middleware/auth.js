import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
  const { token } = req.headers;
  if (!token) {
    return res.json({ success: false, message: "Not Authorized, Login Again" });
  }
  try {
    const token_decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.body.userId = token_decoded.id;
    req.body.role = token_decoded.role;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.json({ success: false, message: "Invalid token" });
  }
};
export default authUser;