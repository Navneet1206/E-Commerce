import crypto from 'crypto';

export const generateOTP = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let otp = '';
  for (let i = 0; i < 4; i++) {
    otp += characters.charAt(crypto.randomInt(0, characters.length));
  }
  return otp;
};

export const generateOtpExpires = () => {
  return new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
};