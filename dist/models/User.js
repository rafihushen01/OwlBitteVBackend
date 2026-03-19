import mongoose, { Schema } from "mongoose";
const userschema = new Schema({
    fullname: { type: String },
    email: { type: String, unique: true, index: true },
    password: { type: String },
    avatar: { type: String },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
    },
    mobile: { type: String },
    role: {
        type: String,
        enum: ["User", "Seller", "Rider", "SellerAdmin", "Admin", "SuperAdmin"],
        default: "User",
    },
    addresses: [
        {
            label: String,
            fulladdress: String,
            city: String,
            area: String,
            lat: Number,
            lng: Number,
            isdefault: { type: Boolean, default: false },
        },
    ],
    wallet: {
        balance: { type: Number, default: 0 },
        currency: { type: String, default: "BDT" },
    },
    totalorders: { type: Number, default: 0 },
    lastorderat: Date,
    isverified: { type: Boolean, default: false },
    isblocked: { type: Boolean, default: false },
    signupotp: String,
    signupotpexpires: Date,
    signupattempts: { type: Number, default: 0 },
    signinotp: String,
    signinotpexpires: Date,
    signinattempts: { type: Number, default: 0 },
    loginattempts: { type: Number, default: 0 },
    lockuntil: Date,
    lastloginip: String,
    lastdevice: String,
    refreshtoken: String
}, {
    timestamps: true,
});
userschema.methods.isLocked = function () {
    return !!(this.lockuntil && this.lockuntil > Date.now());
};
const User = mongoose.model("user", userschema);
export default User;
//# sourceMappingURL=User.js.map