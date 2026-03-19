import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.OTP_GMAIL,
        pass: process.env.OTP_GMAIL_APP_PASS,
    },
});
transporter.verify()
    .then(() => {
    console.log("✅ OwlBite Mail Server Ready");
})
    .catch((err) => {
    console.error("❌ Mail Server Error:", err);
});
const sendMailInternal = async (type, to, otp) => {
    if (!to)
        throw new Error("Recipient email missing");
    if (!otp)
        throw new Error("OTP missing");
    const subject = type === "Signup"
        ? "Verify your OwlBite account"
        : "Login verification for OwlBite";
    const html = `
  <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:20px;border-radius:10px;background:#0f172a;color:white;">
    
    <h2 style="text-align:center;color:#ff4d2d;">OwlBite Security</h2>

    <p>Hello 👋,</p>

    <p>Your <b>${type}</b> OTP is:</p>

    <div style="text-align:center;margin:20px 0;">
      <span style="
        font-size:32px;
        font-weight:bold;
        letter-spacing:6px;
        color:#ff4d2d;
      ">
        ${otp}
      </span>
    </div>

    <p>This OTP is valid for <b>5 minutes</b>.</p>

    <p style="color:#94a3b8;font-size:12px;">
      ⚠️ Never share your OTP with anyone.
    </p>

    <hr style="border-color:#1e293b;" />

    <p style="font-size:12px;color:#64748b;text-align:center;">
      OwlBite © ${new Date().getFullYear()} <br/>
      Secure Food Delivery Platform
    </p>

  </div>
  `;
    await transporter.sendMail({
        from: `OwlBite Security <${process.env.OTP_GMAIL}>`,
        to,
        subject,
        html,
    });
};
export const sendSignupOtp = async (email, otp) => {
    try {
        console.log("🔥 Sending Signup OTP →", email);
        await sendMailInternal("Signup", email, otp);
    }
    catch (error) {
        console.error("❌ Signup OTP Error:", error.message);
        throw new Error("Failed to send signup OTP");
    }
};
export const sendSigninOtp = async (email, otp) => {
    try {
        console.log("🔥 Sending Signin OTP →", email);
        await sendMailInternal("Signin", email, otp);
    }
    catch (error) {
        console.error("❌ Signin OTP Error:", error.message);
        throw new Error("Failed to send signin OTP");
    }
};
//# sourceMappingURL=mail.js.map